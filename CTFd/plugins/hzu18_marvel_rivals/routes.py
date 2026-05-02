from flask import (
    Blueprint,
    Response,
    abort,
    current_app,
    jsonify,
    redirect,
    render_template,
    request,
    stream_with_context,
    url_for,
)

from CTFd.models import db
from CTFd.plugins import bypass_csrf_protection
from CTFd.utils import get_config, set_config
from CTFd.utils.config import ctf_name
from CTFd.utils.decorators import admins_only, authed_only, require_team
from CTFd.utils.user import get_current_team, get_current_user, is_admin

from .helpers import (
    DEFAULT_SCOREBOARD_ORIGINS,
    all_heroes_query,
    bool_config,
    competition_phase,
    current_team_payload,
    enabled_heroes_query,
    event_to_sse,
    hero_picks_locked,
    normalize_hex_color,
    public_origins,
    public_scoreboard_payload,
    publish_event,
    record_event,
    slugify,
    visible_events_query,
)
from .models import HZU18EventLog, HZU18Hero, HZU18TeamHeroPick

hzu18_api = Blueprint("hzu18_api", __name__, url_prefix="/api/v1/hzu18")
hzu18_admin = Blueprint("hzu18_admin", __name__)
hzu18_pages = Blueprint("hzu18_pages", __name__)


def _form_int(name, default=0):
    try:
        return int(request.form.get(name) or default)
    except (TypeError, ValueError):
        return default


def _event_since_id():
    value = request.args.get("since_id") or request.headers.get("Last-Event-ID")
    try:
        return int(value) if value else None
    except (TypeError, ValueError):
        return None


def _replay_events(limit, since_id=None):
    query = visible_events_query()
    if since_id:
        return (
            query.filter(HZU18EventLog.id > since_id)
            .order_by(None)
            .order_by(HZU18EventLog.id.asc())
            .limit(limit)
            .all()
        )

    return list(reversed(query.limit(limit).all()))


def _hero_from_json_payload():
    data = request.get_json(silent=True) or {}
    if data.get("hero_id"):
        return HZU18Hero.query.filter_by(id=data.get("hero_id"), enabled=True).first()
    if data.get("hero_slug"):
        return HZU18Hero.query.filter_by(
            slug=data.get("hero_slug"), enabled=True
        ).first()
    return None


@hzu18_pages.route("/hero", methods=["GET"])
@authed_only
@require_team
def hero_selection():
    return render_template("plugins/hzu18_marvel_rivals/templates/hero.html")


@hzu18_api.after_request
def add_cors_headers(response):
    origin = request.headers.get("Origin")
    allowed = public_origins()

    if "*" in allowed:
        response.headers["Access-Control-Allow-Origin"] = "*"
    elif origin and origin in allowed:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Vary"] = "Origin"

    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = (
        "Authorization, Cache-Control, Content-Type, CSRF-Token"
    )
    return response


@hzu18_api.route("/state", methods=["GET"])
def state():
    return jsonify(
        {
            "success": True,
            "data": {
                "ctf_name": ctf_name(),
                "phase": competition_phase(),
                "start": get_config("start"),
                "freeze": get_config("freeze"),
                "end": get_config("end"),
                "hero_picks_locked": hero_picks_locked(),
                "unique_heroes": True,
                "scoreboard_origins": public_origins(),
            },
        }
    )


@hzu18_api.route("/heroes", methods=["GET"])
def heroes():
    if request.args.get("all") and is_admin():
        heroes_query = all_heroes_query()
    else:
        heroes_query = enabled_heroes_query()

    return jsonify(
        {"success": True, "data": [hero.to_dict() for hero in heroes_query.all()]}
    )


@hzu18_api.route("/team/hero", methods=["GET"])
@authed_only
@require_team
def team_hero():
    team = get_current_team()
    user = get_current_user()
    return jsonify({"success": True, "data": current_team_payload(team, user)})


@hzu18_api.route("/team/hero", methods=["POST"])
@authed_only
@require_team
def pick_team_hero():
    user = get_current_user()
    team = get_current_team()

    if team.captain_id != user.id:
        return (
            jsonify(
                {
                    "success": False,
                    "errors": {"": ["Only the team captain can pick the team hero"]},
                }
            ),
            403,
        )

    return (
        jsonify(
            {
                "success": False,
                "errors": {
                    "": ["Hero selections are only saved after confirmation"]
                },
            }
        ),
        405,
    )


@hzu18_api.route("/team/hero/confirm", methods=["POST"])
@authed_only
@require_team
def confirm_team_hero():
    team = get_current_team()
    user = get_current_user()

    if team.captain_id != user.id:
        return (
            jsonify(
                {
                    "success": False,
                    "errors": {
                        "": ["Only the team captain can confirm the team hero"]
                    },
                }
            ),
            403,
        )

    if hero_picks_locked():
        return (
            jsonify(
                {
                    "success": False,
                    "errors": {"": ["Hero picks are locked"]},
                }
            ),
            403,
        )

    pick = HZU18TeamHeroPick.query.filter_by(team_id=team.id).first()
    if pick and pick.locked:
        return (
            jsonify(
                {
                    "success": False,
                    "errors": {"": ["This team's hero pick is locked"]},
                }
            ),
            403,
        )

    hero = _hero_from_json_payload()
    if hero is None and pick and pick.hero:
        hero = HZU18Hero.query.filter_by(id=pick.hero_id, enabled=True).first()

    if hero is None:
        return (
            jsonify(
                {
                    "success": False,
                    "errors": {"hero": ["Please choose an enabled hero"]},
                }
            ),
            400,
        )

    taken = HZU18TeamHeroPick.query.filter(
        HZU18TeamHeroPick.hero_id == hero.id,
        HZU18TeamHeroPick.team_id != team.id,
        HZU18TeamHeroPick.locked.is_(True),
    ).first()
    if taken:
        return (
            jsonify(
                {
                    "success": False,
                    "errors": {"hero": ["That hero has already been confirmed"]},
                }
            ),
            409,
        )

    if pick is None:
        pick = HZU18TeamHeroPick(team_id=team.id)

    pick.hero_id = hero.id
    pick.locked = True
    pick.picked_by_user_id = user.id
    db.session.add(pick)
    event = record_event(
        "hero_selected",
        {
            "team_id": team.id,
            "team_name": team.name,
            "picked_by_user_id": user.id,
            "picked_by_name": user.name,
            "hero": hero.to_dict(),
        },
    )
    db.session.commit()
    publish_event(event)

    return jsonify({"success": True, "data": current_team_payload(team, user)})


@hzu18_api.route("/scoreboard", methods=["GET"])
def scoreboard():
    return jsonify({"success": True, "data": public_scoreboard_payload()})


@hzu18_api.route("/scoreboard/result", methods=["GET"])
def scoreboard_result():
    return jsonify(
        {"success": True, "data": public_scoreboard_payload(ignore_freeze=True)}
    )


@hzu18_api.route("/events/recent", methods=["GET"])
def recent_events():
    limit = max(1, min(request.args.get("limit", 25, type=int), 100))
    events = _replay_events(limit=limit, since_id=_event_since_id())
    return jsonify({"success": True, "data": [event.to_dict() for event in events]})


@hzu18_api.route("/events", methods=["GET"])
@bypass_csrf_protection
def events():
    limit = max(0, min(request.args.get("replay", 25, type=int), 100))
    since_id = _event_since_id()

    @stream_with_context
    def stream():
        if limit:
            replay_events = _replay_events(limit=limit, since_id=since_id)
            for event in replay_events:
                yield event_to_sse(event)

        db.session.close()
        for event in current_app.events_manager.subscribe(channel="hzu18"):
            yield str(event)

    response = Response(stream(), mimetype="text/event-stream")
    response.headers["Cache-Control"] = "no-cache"
    return response


@hzu18_api.route("/admin/announcements", methods=["POST"])
@admins_only
def admin_announcement():
    data = request.get_json(silent=True) or {}
    title = str(data.get("title", "")).strip()
    detail = str(data.get("detail", "")).strip()
    if not title:
        return (
            jsonify(
                {"success": False, "errors": {"title": ["Title is required"]}}
            ),
            400,
        )

    event = record_event(
        "organizer_announcement",
        {
            "title": title,
            "detail": detail,
            "accent": normalize_hex_color(data.get("accent"), "#38bdf8"),
        },
    )
    db.session.commit()
    publish_event(event)
    return jsonify({"success": True, "data": event.to_dict()})


def _admin_context(errors=None):
    return {
        "errors": errors or [],
        "heroes": all_heroes_query().all(),
        "picks": HZU18TeamHeroPick.query.order_by(
            HZU18TeamHeroPick.picked_at.desc()
        ).all(),
        "settings": {
            "picks_locked": bool_config("hzu18_hero_picks_locked", default=False),
            "unique_heroes": True,
            "scoreboard_origins": get_config(
                "hzu18_scoreboard_origins", default=DEFAULT_SCOREBOARD_ORIGINS
            ),
        },
    }


@hzu18_admin.route("/admin/hzu18/heroes", methods=["GET", "POST"])
@admins_only
def admin_heroes():
    if request.method == "GET":
        return render_template(
            "plugins/hzu18_marvel_rivals/templates/admin/heroes.html",
            **_admin_context(),
        )

    action = request.form.get("action")
    errors = []

    if action == "settings":
        set_config(
            "hzu18_hero_picks_locked",
            "true" if request.form.get("picks_locked") else "false",
        )
        set_config(
            "hzu18_unique_heroes",
            "true" if request.form.get("unique_heroes") else "false",
        )
        set_config(
            "hzu18_scoreboard_origins",
            request.form.get("scoreboard_origins", DEFAULT_SCOREBOARD_ORIGINS).strip(),
        )
        return redirect(url_for("hzu18_admin.admin_heroes"))

    name = request.form.get("name", "").strip()
    if not name:
        errors.append("Hero name is required")

    slug = slugify(request.form.get("slug") or name)
    if HZU18Hero.query.filter_by(slug=slug).first():
        errors.append("Hero slug already exists")

    if errors:
        return (
            render_template(
                "plugins/hzu18_marvel_rivals/templates/admin/heroes.html",
                **_admin_context(errors=errors),
            ),
            400,
        )

    hero = HZU18Hero(
        slug=slug,
        name=name,
        role=request.form.get("role", "Flex").strip() or "Flex",
        enabled=bool(request.form.get("enabled")),
        sort_order=_form_int("sort_order"),
        portrait_path=request.form.get("portrait_path", "").strip() or None,
        sound_path=request.form.get("sound_path", "").strip() or None,
        theme_color=normalize_hex_color(request.form.get("theme_color")),
    )
    db.session.add(hero)
    db.session.commit()
    return redirect(url_for("hzu18_admin.admin_heroes"))


@hzu18_admin.route("/admin/hzu18/heroes/<int:hero_id>", methods=["POST"])
@admins_only
def admin_update_hero(hero_id):
    hero = HZU18Hero.query.filter_by(id=hero_id).first_or_404()
    slug = slugify(request.form.get("slug") or hero.slug)
    duplicate = HZU18Hero.query.filter(
        HZU18Hero.slug == slug, HZU18Hero.id != hero.id
    ).first()
    if duplicate:
        abort(400, description="Hero slug already exists")

    hero.slug = slug
    hero.name = request.form.get("name", hero.name).strip() or hero.name
    hero.role = request.form.get("role", hero.role).strip() or "Flex"
    hero.enabled = bool(request.form.get("enabled"))
    hero.sort_order = _form_int("sort_order")
    hero.portrait_path = request.form.get("portrait_path", "").strip() or None
    hero.sound_path = request.form.get("sound_path", "").strip() or None
    hero.theme_color = normalize_hex_color(request.form.get("theme_color"))
    db.session.commit()
    return redirect(url_for("hzu18_admin.admin_heroes"))


@hzu18_admin.route("/admin/hzu18/heroes/<int:hero_id>/delete", methods=["POST"])
@admins_only
def admin_delete_hero(hero_id):
    hero = HZU18Hero.query.filter_by(id=hero_id).first_or_404()
    db.session.delete(hero)
    db.session.commit()
    return redirect(url_for("hzu18_admin.admin_heroes"))
