import datetime
import json
import re
import time
from functools import wraps

from flask import current_app

from CTFd.cache import clear_standings
from CTFd.models import Challenges, Solves, Teams, db
from CTFd.utils import get_config, set_config
from CTFd.utils.config import ctf_name, is_scoreboard_frozen
from CTFd.utils.dates import isoformat, unix_time_to_utc
from CTFd.utils.events import ServerSentEvent
from CTFd.utils.scores import get_standings

from .models import HZU18EventLog, HZU18Hero, HZU18TeamHeroPick

DEFAULT_SCOREBOARD_ORIGINS = (
    "https://scoreboard.haruulzangi.mn,"
    "http://localhost:3000,"
    "http://127.0.0.1:3000"
)

OFFICIAL_HERO_IMAGES = {
    "adam-warlock": "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d21.png?v=20241123",
    "angela": "https://r.res.easebar.com/pic/20250912/fb42acc6-da42-472d-bf2d-d7efd4dff5b5.png?v=20241123",
    "black-cat": "https://r.res.easebar.com/pic/20260417/2c0db7d2-1232-44de-865b-4ce1a4f6b70e.png?v=20241123",
    "black-panther": "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d1.png?v=20241123",
    "black-widow": "https://r.res.easebar.com/pic/20241205/7e34f06f-150f-4ad3-8c86-2c7c73e95493.png?v=20241123",
    "blade": "https://r.res.easebar.com/pic/20250808/d4aa1ebb-46cb-4ae8-ac82-611ea004609c.png?v=20241123",
    "bruce-banner": "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d19.png?v=20241123",
    "captain-america": "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d24.png?v=20241123",
    "cloak-dagger": "https://r.res.easebar.com/pic/20241205/0f7b7427-3ff1-42d4-a965-3f35d4f49b51.png?v=20241123",
    "daredevil": "https://r.res.easebar.com/pic/20251011/bdf306ae-a908-495c-abcd-be4472db6620.png?v=20241123",
    "deadpool": "https://r.res.easebar.com/pic/20260116/e877384d-6fa4-47d6-b040-f7300c7d0367.png?v=20241123",
    "doctor-strange": "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d2.png?v=20241123",
    "elsa-bloodstone": "https://r.res.easebar.com/pic/20260213/985677e8-fd80-47ed-96cc-8309404e71d0.png?v=20241123",
    "emma-frost": "https://r.res.easebar.com/pic/20250408/8a48f02e-4525-42e9-b465-38e228aee7db.png?v=20241123",
    "gambit": "https://r.res.easebar.com/pic/20251115/a8e9881e-cc5b-4b01-99db-d83a4ced5aca.png?v=20241123",
    "groot": "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d3.png?v=20241123",
    "hawkeye": "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d27.png?v=20241123",
    "hela": "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d5.png?v=20241123",
    "human-torch": "https://r.res.easebar.com/pic/20250220/d9c2e23d-53e8-4115-9ce1-008d22c5aa2e.png?v=20241123",
    "invisible-woman": "https://r.res.easebar.com/pic/20250113/c63fb614-e16c-46ce-877d-43317debebd5.png?v=20241123",
    "iron-fist": "https://r.res.easebar.com/pic/20241201/18ea989f-ba46-432d-93c3-87463215de53.png?v=20241123",
    "iron-man": "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d6.png?v=20241123",
    "jeff-the-land-shark": "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d23.png?v=20241123",
    "loki": "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d7.png?v=20241123",
    "luna-snow": "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d18.png?v=20241123",
    "magik": "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d12.png?v=20241123",
    "magneto": "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d11.png?v=20241123",
    "mantis": "https://r.res.easebar.com/pic/20250131/e5b6506e-c783-4f2d-980d-83f167473b82.png?v=20241123",
    "mister-fantastic": "https://r.res.easebar.com/pic/20250113/54cfc983-1e9d-45b5-9dcd-ff3228425347.png?v=20241123",
    "moon-knight": "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d26.png?v=20241123",
    "namor": "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d20.png?v=20241123",
    "peni-parker": "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d10.png?v=20241123",
    "phoenix": "https://r.res.easebar.com/pic/20250711/570fc7a9-f109-4048-a997-ee40f292034d.png?v=20241123",
    "psylocke": "https://r.res.easebar.com/pic/20241127/32976573-8ea6-401a-86bd-7931248cd94e.png?v=20241123",
    "rocket-raccoon": "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d8.png?v=20241123",
    "rogue": "https://r.res.easebar.com/pic/20251212/f6f6bb5a-a093-467a-9e1b-a34915911967.png?v=20241123",
    "scarlet-witch": "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d15.png?v=20241123",
    "spider-man": "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d13.png?v=20241123",
    "squirrel-girl": "https://r.res.easebar.com/pic/20241201/aae04d93-a3ac-49d8-a8c3-bb9ab47b2bd9.png?v=20241123",
    "star-lord": "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d16.png?v=20241123",
    "storm": "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d17.png?v=20241123",
    "the-punisher": "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d4.png?v=20241123",
    "the-thing": "https://r.res.easebar.com/pic/20250220/657d8eca-6d1f-4ad9-8c9a-99e1afac2a25.png?v=20241123",
    "thor": "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d22.png?v=20241123",
    "ultron": "https://r.res.easebar.com/pic/20250531/1ff03b44-8874-4962-a87a-19f2871f1e92.png?v=20241123",
    "venom": "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d14.png?v=20241123",
    "white-fox": "https://r.res.easebar.com/pic/20260320/a365b954-636c-4b3a-8dce-b81898cbda72.png?v=20241123",
    "winter-soldier": "https://www.marvelrivals.com/pc/gw/5da825b19a6a/heros/d25.png?v=20241123",
    "wolverine": "https://r.res.easebar.com/pic/20241205/04d0322f-e929-4b81-81e9-4817a3f221e1.png?v=20241123",
}

OFFICIAL_HERO_IMAGE_VALUES = set(OFFICIAL_HERO_IMAGES.values())


def default_hero(slug, name, sort_order, theme_color, portrait_path):
    return {
        "slug": slug,
        "name": name,
        "role": "Hero",
        "sort_order": sort_order,
        "theme_color": theme_color,
        "portrait_path": OFFICIAL_HERO_IMAGES.get(slug, portrait_path),
    }


DEFAULT_HEROES = [
    default_hero("adam-warlock", "Adam Warlock", 10, "#e29058", None),
    default_hero("angela", "Angela", 20, "#ffb158", None),
    default_hero("black-cat", "Black Cat", 30, "#B79FFE", None),
    default_hero("black-panther", "Black Panther", 40, "#7c5a93", None),
    default_hero("black-widow", "Black Widow", 50, "#6C7283", None),
    default_hero("blade", "Blade", 60, "#ff6c67", None),
    default_hero("bruce-banner", "Bruce Banner", 70, "#4d8d6f", None),
    default_hero("captain-america", "Captain America", 80, "#4e8bd0", None),
    default_hero("cloak-dagger", "Cloak & Dagger", 90, "#a2b7fd", None),
    default_hero("daredevil", "Daredevil", 100, "#f0597d", None),
    default_hero("deadpool", "Deadpool", 110, "#ff6c67", None),
    default_hero("doctor-strange", "Doctor Strange", 120, "#fd7b73", None),
    default_hero("elsa-bloodstone", "Elsa Bloodstone", 130, "#e86245", None),
    default_hero("emma-frost", "Emma Frost", 140, "#7aefff", None),
    default_hero("gambit", "Gambit", 150, "#ff97e0", None),
    default_hero("groot", "Groot", 160, "#9ec67a", None),
    default_hero("hawkeye", "Hawkeye", 170, "#a482c4", None),
    default_hero("hela", "Hela", 180, "#4da7a7", None),
    default_hero("human-torch", "Human Torch", 190, "#e47263", None),
    default_hero("invisible-woman", "Invisible Woman", 200, "#0ec4ff", None),
    default_hero("iron-fist", "Iron Fist", 210, "#32b5a2", None),
    default_hero("iron-man", "Iron Man", 220, "#ff6680", None),
    default_hero("jeff-the-land-shark", "Jeff the Land Shark", 230, "#7793c3", None),
    default_hero("loki", "Loki", 240, "#62a173", None),
    default_hero("luna-snow", "Luna Snow", 250, "#227ddf", None),
    default_hero("magik", "Magik", 260, "#ab7977", None),
    default_hero("magneto", "Magneto", 270, "#7167a4", None),
    default_hero("mantis", "Mantis", 280, "#85a77e", None),
    default_hero("mister-fantastic", "Mister Fantastic", 290, "#2bc5ec", None),
    default_hero("moon-knight", "Moon Knight", 300, "#809ab0", None),
    default_hero("namor", "Namor", 310, "#35afa5", None),
    default_hero("peni-parker", "Peni Parker", 320, "#fe6d67", None),
    default_hero("phoenix", "Phoenix", 330, "#fd7b73", None),
    default_hero("psylocke", "Psylocke", 340, "#c672da", None),
    default_hero("rocket-raccoon", "Rocket Raccoon", 350, "#f58b6a", None),
    default_hero("rogue", "Rogue", 360, "#e4ca62", None),
    default_hero("scarlet-witch", "Scarlet Witch", 370, "#f3597e", None),
    default_hero("spider-man", "Spider-Man", 380, "#fc6775", None),
    default_hero("squirrel-girl", "Squirrel Girl", 390, "#f4a366", None),
    default_hero("star-lord", "Star-Lord", 400, "#6498e6", None),
    default_hero("storm", "Storm", 410, "#5a6590", None),
    default_hero("the-punisher", "The Punisher", 420, "#5f6a7e", None),
    default_hero("the-thing", "The Thing", 430, "#fbb565", None),
    default_hero("thor", "Thor", 440, "#707cc9", None),
    default_hero("ultron", "Ultron", 450, "#8492bb", None),
    default_hero("venom", "Venom", 460, "#3d4252", None),
    default_hero("white-fox", "White Fox", 470, "#6edcde", None),
    default_hero("winter-soldier", "Winter Soldier", 480, "#727051", None),
    default_hero("wolverine", "Wolverine", 490, "#deb23d", None),
]


def slugify(value):
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug[:64] or "hero"


def normalize_hex_color(value, default="#2dd4bf"):
    if value and re.match(r"^#[0-9a-fA-F]{6}$", value):
        return value.lower()
    return default


def bool_config(key, default=False):
    value = get_config(key, default=default)
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in {"1", "true", "yes", "on"}
    return bool(value)


def public_origins():
    origins = get_config("hzu18_scoreboard_origins", default=DEFAULT_SCOREBOARD_ORIGINS)
    if not origins:
        return []
    return [origin.strip() for origin in str(origins).split(",") if origin.strip()]


def hero_picks_locked():
    return bool_config("hzu18_hero_picks_locked", default=False)


def competition_phase():
    now = int(time.time())
    start = get_config("start")
    freeze = get_config("freeze")
    end = get_config("end")

    try:
        start = int(start) if start else None
        freeze = int(freeze) if freeze else None
        end = int(end) if end else None
    except (TypeError, ValueError):
        start, freeze, end = None, None, None

    if end and now >= end:
        if bool_config("hzu18_reveal_active", default=False):
            return "reveal"
        return "ended"
    if start and now < start:
        return "prestart"
    if freeze and now >= freeze:
        return "frozen"
    return "live"


def should_replace_default_portrait(value, expected=None):
    if not value or "static.wikia.nocookie.net" in value:
        return True
    return bool(expected and value in OFFICIAL_HERO_IMAGE_VALUES and value != expected)


def seed_default_heroes():
    existing_heroes = {hero.slug: hero for hero in HZU18Hero.query.all()}
    existing_slugs = set(existing_heroes)
    changed = False

    for hero_data in DEFAULT_HEROES:
        if hero_data["slug"] in existing_slugs:
            hero = existing_heroes[hero_data["slug"]]
            if should_replace_default_portrait(
                hero.portrait_path, hero_data["portrait_path"]
            ):
                hero.portrait_path = hero_data["portrait_path"]
                changed = True
            continue

        db.session.add(HZU18Hero(**hero_data))
        changed = True

    if changed:
        db.session.commit()


def enabled_heroes_query():
    return HZU18Hero.query.filter_by(enabled=True).order_by(
        HZU18Hero.sort_order.asc(), HZU18Hero.name.asc()
    )


def all_heroes_query():
    return HZU18Hero.query.order_by(HZU18Hero.sort_order.asc(), HZU18Hero.name.asc())


def record_event(event_type, payload, visible_at=None, replayable=True):
    event = HZU18EventLog(
        event_type=event_type,
        payload_json=json.dumps(payload, sort_keys=True),
        visible_at=visible_at or datetime.datetime.utcnow(),
        replayable=replayable,
    )
    db.session.add(event)
    db.session.flush()
    return event


def publish_event(event):
    current_app.events_manager.publish(
        data=event.to_dict(), type=event.event_type, id=event.id, channel="hzu18"
    )


def event_to_sse(event):
    return str(
        ServerSentEvent(data=event.to_dict(), type=event.event_type, id=event.id)
    )


def visible_events_query():
    now = datetime.datetime.utcnow()
    return HZU18EventLog.query.filter(
        HZU18EventLog.replayable.is_(True),
        HZU18EventLog.visible_at <= now,
    ).order_by(HZU18EventLog.id.desc())


def public_leader_team_id():
    visible_team_ids = {
        team.id for team in Teams.query.filter_by(hidden=False, banned=False).all()
    }
    if not visible_team_ids:
        return None

    for row in get_standings():
        team_id = row.account_id
        if team_id in visible_team_ids and int(row.score or 0) > 0:
            return team_id

    return None


def team_score(team_id):
    for row in get_standings():
        if row.account_id == team_id:
            return int(row.score or 0)
    return 0


def team_name(team_id):
    team = Teams.query.filter_by(id=team_id).first()
    return team.name if team else None


def solve_event_payload(user, team, challenge):
    pick = HZU18TeamHeroPick.query.filter_by(team_id=team.id).first()
    hero = pick.hero if pick and pick.locked and pick.hero else None
    hero_payload = hero.to_dict() if hero else None

    return {
        "team_id": team.id,
        "team_name": team.name,
        "user_id": user.id,
        "user_name": user.name,
        "challenge_id": challenge.id,
        "challenge_name": challenge.name,
        "score_delta": int(challenge.value or 0),
        "new_score": team_score(team.id),
        "hero": hero_payload,
        "sound_url": hero.sound_path if hero else None,
    }


def emit_solve_events(user, team, challenge, previous_leader_team_id):
    if get_config("user_mode") != "teams" or team is None:
        return

    if is_scoreboard_frozen():
        return

    clear_standings()
    payload = solve_event_payload(user=user, team=team, challenge=challenge)
    events = [record_event("flag_correct", payload)]
    first_blood = bool_config("hzu18_first_blood_emitted", default=False) is False

    if first_blood:
        events.append(record_event("first_blood", payload))

    current_leader_team_id = public_leader_team_id()
    if current_leader_team_id and current_leader_team_id != previous_leader_team_id:
        events.append(
            record_event(
                "leader_changed",
                {
                    "previous_leader_team_id": previous_leader_team_id,
                    "previous_leader_name": team_name(previous_leader_team_id)
                    if previous_leader_team_id
                    else None,
                    "new_leader_team_id": current_leader_team_id,
                    "new_leader_name": team_name(current_leader_team_id),
                    "new_score": team_score(current_leader_team_id),
                },
            )
        )

    if first_blood:
        set_config("hzu18_first_blood_emitted", "true")
    else:
        db.session.commit()

    for event in events:
        publish_event(event)


def install_solve_event_hook():
    from CTFd.plugins.challenges import BaseChallenge

    original_solve = BaseChallenge.solve.__func__
    if getattr(original_solve, "_hzu18_solve_hooked", False):
        return

    @wraps(original_solve)
    def solve_with_hzu18_events(cls, user, team, challenge, request):
        previous_leader_team_id = public_leader_team_id()
        result = original_solve(cls, user, team, challenge, request)

        try:
            emit_solve_events(
                user=user,
                team=team,
                challenge=challenge,
                previous_leader_team_id=previous_leader_team_id,
            )
        except Exception:
            current_app.logger.exception("Failed to emit HZU18 solve events")

        return result

    solve_with_hzu18_events._hzu18_solve_hooked = True
    BaseChallenge.solve = classmethod(solve_with_hzu18_events)


def current_team_payload(team, user):
    pick = HZU18TeamHeroPick.query.filter_by(team_id=team.id).first()
    confirmed_pick = pick if pick and pick.locked else None
    locked = hero_picks_locked() or bool(pick.locked if pick else False)
    is_captain = team.captain_id == user.id
    hero_claims = {
        claim.hero_id: claim
        for claim in HZU18TeamHeroPick.query.filter(
            HZU18TeamHeroPick.hero_id.isnot(None),
            HZU18TeamHeroPick.locked.is_(True),
        ).all()
    }
    heroes = []

    for hero in enabled_heroes_query().all():
        hero_data = hero.to_dict()
        claim = hero_claims.get(hero.id)
        hero_data.update(
            {
                "claimed": bool(claim),
                "claimed_by_current_team": bool(claim and claim.team_id == team.id),
                "claimed_by_team_id": claim.team_id if claim else None,
                "claimed_by_team_name": claim.team.name
                if claim and claim.team
                else None,
            }
        )
        heroes.append(hero_data)

    return {
        "team_id": team.id,
        "captain_id": team.captain_id,
        "is_captain": is_captain,
        "locked": locked,
        "can_pick": is_captain and locked is False,
        "can_confirm": False,
        "confirmed": bool(confirmed_pick),
        "selected_claimed_by_other": False,
        "pick": confirmed_pick.to_dict() if confirmed_pick else None,
        "selected": confirmed_pick.hero.to_dict()
        if confirmed_pick and confirmed_pick.hero
        else None,
        "heroes": heroes,
    }


def solve_summaries(team_ids, ignore_freeze=False):
    summaries = {
        team_id: {"solve_count": 0, "last_solve": None, "delta": 0}
        for team_id in team_ids
    }
    if not team_ids:
        return summaries

    query = (
        Solves.query.join(Challenges)
        .filter(Solves.team_id.in_(team_ids))
        .order_by(Solves.date.desc(), Solves.id.desc())
    )

    freeze = get_config("freeze")
    if freeze and not ignore_freeze:
        query = query.filter(Solves.date < unix_time_to_utc(int(freeze)))

    for solve in query.all():
        summary = summaries.setdefault(
            solve.team_id, {"solve_count": 0, "last_solve": None, "delta": 0}
        )
        summary["solve_count"] += 1
        if summary["last_solve"] is None:
            summary["last_solve"] = isoformat(solve.date)
            summary["delta"] = int(solve.challenge.value or 0)

    return summaries


def public_scoreboard_payload(ignore_freeze=False):
    if get_config("user_mode") != "teams":
        return {
            "ctf_name": ctf_name(),
            "phase": competition_phase(),
            "locked": hero_picks_locked(),
            "standings": [],
        }

    visible_teams = Teams.query.filter_by(hidden=False, banned=False).order_by(
        Teams.name.asc()
    )
    teams = {team.id: team for team in visible_teams.all()}
    standings = get_standings(admin=ignore_freeze)
    ordered_team_ids = []
    scores = {}

    for row in standings:
        team_id = row.account_id
        if team_id not in teams:
            continue
        ordered_team_ids.append(team_id)
        scores[team_id] = int(row.score or 0)

    scored = set(ordered_team_ids)
    ordered_team_ids.extend(team_id for team_id in teams if team_id not in scored)

    picks = {
        pick.team_id: pick
        for pick in HZU18TeamHeroPick.query.filter(
            HZU18TeamHeroPick.team_id.in_(ordered_team_ids)
        ).all()
    }
    summaries = solve_summaries(ordered_team_ids, ignore_freeze=ignore_freeze)
    locked = hero_picks_locked()

    rows = []
    for rank, team_id in enumerate(ordered_team_ids, start=1):
        team = teams[team_id]
        pick = picks.get(team_id)
        confirmed_pick = pick if pick and pick.locked else None
        summary = summaries.get(team_id, {})
        rows.append(
            {
                "rank": rank,
                "team_id": team.id,
                "team_name": team.name,
                "score": scores.get(team.id, 0),
                "bracket_id": team.bracket_id,
                "bracket_name": team.bracket.name if team.bracket else None,
                "hero": confirmed_pick.hero.to_dict()
                if confirmed_pick and confirmed_pick.hero
                else None,
                "hero_pick_locked": locked or bool(pick.locked if pick else False),
                "solved_challenges": summary.get("solve_count", 0),
                "last_solve": summary.get("last_solve"),
                "delta": summary.get("delta", 0),
            }
        )

    return {
        "ctf_name": ctf_name(),
        "phase": competition_phase(),
        "locked": locked,
        "scoreboard_frozen": is_scoreboard_frozen() and not ignore_freeze,
        "standings": rows,
    }
