import datetime
import time

from flask import request

from CTFd.cache import clear_standings
from CTFd.plugins.hzu18_marvel_rivals.helpers import (
    OFFICIAL_HERO_IMAGES,
    record_event,
    seed_default_heroes,
)
from CTFd.plugins.challenges import BaseChallenge
from CTFd.plugins.hzu18_marvel_rivals.models import (
    HZU18EventLog,
    HZU18Hero,
    HZU18TeamHeroPick,
)
from CTFd.utils import set_config
from tests.helpers import (
    create_ctfd,
    destroy_ctfd,
    gen_challenge,
    gen_solve,
    gen_team,
    login_as_user,
)


def test_hzu18_heroes_seed_and_public_api():
    app = create_ctfd(user_mode="teams", enable_plugins=True)
    with app.app_context():
        heroes_by_slug = {hero.slug: hero for hero in HZU18Hero.query.all()}
        for slug, portrait_path in OFFICIAL_HERO_IMAGES.items():
            assert heroes_by_slug[slug].portrait_path == portrait_path

        for slug in (
            "bruce-banner",
            "captain-america",
            "deadpool",
            "elsa-bloodstone",
            "hela",
        ):
            heroes_by_slug[slug].portrait_path = OFFICIAL_HERO_IMAGES[
                "doctor-strange"
            ]
        app.db.session.commit()

        seed_default_heroes()
        heroes_by_slug = {hero.slug: hero for hero in HZU18Hero.query.all()}
        for slug, portrait_path in OFFICIAL_HERO_IMAGES.items():
            assert heroes_by_slug[slug].portrait_path == portrait_path

        disabled = HZU18Hero.query.filter_by(enabled=True).first()
        disabled_id = disabled.id
        disabled.enabled = False
        app.db.session.commit()

        with app.test_client() as client:
            response = client.get("/api/v1/hzu18/heroes")
            assert response.status_code == 200
            data = response.get_json()["data"]
            assert len(data) >= 1
            assert data[0]["slug"]
            assert any(hero["portrait_path"] for hero in data)
            assert all(
                "static.wikia.nocookie.net" not in hero["portrait_path"]
                for hero in data
            )
            assert {hero["role"] for hero in data} == {"Hero"}
            assert disabled_id not in {hero["id"] for hero in data}

        with login_as_user(app, name="admin") as client:
            response = client.get("/api/v1/hzu18/heroes?all=1")
            data = response.get_json()["data"]
            assert disabled_id in {hero["id"] for hero in data}
    destroy_ctfd(app)


def test_hzu18_admin_page_loads():
    app = create_ctfd(user_mode="teams", enable_plugins=True)
    with app.app_context():
        with login_as_user(app, name="admin") as client:
            response = client.get("/admin/hzu18/heroes")
            assert response.status_code == 200
            assert "HZU18 Heroes" in response.get_data(as_text=True)
            assert "Remove" in response.get_data(as_text=True)
    destroy_ctfd(app)


def test_hzu18_admin_can_remove_hero_and_related_picks():
    app = create_ctfd(user_mode="teams", enable_plugins=True)
    with app.app_context():
        team = gen_team(app.db, member_count=1)
        hero = HZU18Hero.query.filter_by(enabled=True).first()
        hero_id = hero.id
        pick = HZU18TeamHeroPick(
            team_id=team.id,
            hero_id=hero_id,
            picked_by_user_id=team.captain.id,
            locked=True,
        )
        app.db.session.add(pick)
        app.db.session.commit()

        with login_as_user(app, name="admin") as client:
            with client.session_transaction() as sess:
                nonce = sess.get("nonce")
            response = client.post(
                f"/admin/hzu18/heroes/{hero_id}/delete",
                data={"nonce": nonce},
            )
            assert response.status_code == 302

        assert HZU18Hero.query.filter_by(id=hero_id).first() is None
        assert HZU18TeamHeroPick.query.filter_by(hero_id=hero_id).first() is None
    destroy_ctfd(app)


def test_hzu18_hero_page_is_separate_from_team_page():
    app = create_ctfd(user_mode="teams", enable_plugins=True)
    with app.app_context():
        team = gen_team(app.db, member_count=1)

        with login_as_user(app, name=team.captain.name) as client:
            response = client.get("/hero")
            assert response.status_code == 200
            body = response.get_data(as_text=True)
            assert "hzu18-hero-selection-mount" in body
            assert "hero-select.css" in body
            assert "hero-select.js" in body

            team_response = client.get("/team")
            assert team_response.status_code == 200
            team_body = team_response.get_data(as_text=True)
            assert "hzu18-hero-selection-mount" not in team_body
            assert "hero-select.css" not in team_body
            assert "hero-select.js" not in team_body
    destroy_ctfd(app)


def test_hzu18_selection_post_does_not_store_unconfirmed_hero():
    app = create_ctfd(user_mode="teams", enable_plugins=True)
    with app.app_context():
        team = gen_team(app.db, member_count=2)
        hero = HZU18Hero.query.filter_by(enabled=True).first()
        captain = team.captain

        with login_as_user(app, name=captain.name) as client:
            response = client.post(
                "/api/v1/hzu18/team/hero", json={"hero_id": hero.id}
            )
            assert response.status_code == 405
            assert response.get_json()["errors"][""] == [
                "Hero selections are only saved after confirmation"
            ]

        pick = HZU18TeamHeroPick.query.filter_by(team_id=team.id).first()
        assert pick is None
        assert HZU18EventLog.query.count() == 0
    destroy_ctfd(app)


def test_hzu18_captain_confirms_hero_and_cannot_change_after_confirm():
    app = create_ctfd(user_mode="teams", enable_plugins=True)
    with app.app_context():
        team = gen_team(app.db, member_count=1)
        heroes = HZU18Hero.query.filter_by(enabled=True).limit(2).all()
        first_hero = heroes[0]
        second_hero = heroes[1]
        captain = team.captain

        with login_as_user(app, name=captain.name) as client:
            response = client.post(
                "/api/v1/hzu18/team/hero/confirm",
                json={"hero_id": first_hero.id},
            )
            assert response.status_code == 200
            data = response.get_json()["data"]
            assert data["selected"]["id"] == first_hero.id
            assert data["can_pick"] is False
            assert data["can_confirm"] is False
            assert data["confirmed"] is True

            response = client.post(
                "/api/v1/hzu18/team/hero/confirm",
                json={"hero_id": second_hero.id},
            )
            assert response.status_code == 403
            assert response.get_json()["errors"][""] == [
                "This team's hero pick is locked"
            ]

        pick = HZU18TeamHeroPick.query.filter_by(team_id=team.id).first()
        assert pick.hero_id == first_hero.id
        assert pick.locked is True

        events = HZU18EventLog.query.order_by(HZU18EventLog.id.asc()).all()
        assert [event.event_type for event in events] == ["hero_selected"]
        assert events[0].payload["team_id"] == team.id
        assert events[0].payload["hero"]["id"] == first_hero.id
    destroy_ctfd(app)


def test_hzu18_team_cannot_pick_hero_claimed_by_another_team():
    app = create_ctfd(user_mode="teams", enable_plugins=True)
    with app.app_context():
        first_team = gen_team(
            app.db, name="team1", email="team1@examplectf.com", member_count=1
        )
        second_team = gen_team(
            app.db, name="team2", email="team2@examplectf.com", member_count=1
        )
        hero = HZU18Hero.query.filter_by(enabled=True).first()
        hero_id = hero.id
        first_team_id = first_team.id
        first_team_name = first_team.name
        first_captain_name = first_team.captain.name
        second_team_id = second_team.id
        second_captain_name = second_team.captain.name
        set_config("hzu18_unique_heroes", "false")

        with login_as_user(app, name=first_captain_name) as client:
            response = client.post(
                "/api/v1/hzu18/team/hero/confirm", json={"hero_id": hero_id}
            )
            assert response.status_code == 200

        with login_as_user(app, name=second_captain_name) as client:
            response = client.get("/api/v1/hzu18/team/hero")
            assert response.status_code == 200
            data = response.get_json()["data"]
            heroes = data["heroes"]
            claimed_hero = next(item for item in heroes if item["id"] == hero_id)
            assert claimed_hero["claimed"] is True
            assert claimed_hero["claimed_by_current_team"] is False
            assert claimed_hero["claimed_by_team_id"] == first_team_id
            assert claimed_hero["claimed_by_team_name"] == first_team_name
            assert data["can_confirm"] is False

            response = client.post(
                "/api/v1/hzu18/team/hero/confirm", json={"hero_id": hero_id}
            )
            assert response.status_code == 409
            assert response.get_json()["errors"]["hero"] == [
                "That hero has already been confirmed"
            ]

        assert (
            HZU18TeamHeroPick.query.filter_by(team_id=second_team_id).first() is None
        )
    destroy_ctfd(app)


def test_hzu18_only_captain_can_pick_hero():
    app = create_ctfd(user_mode="teams", enable_plugins=True)
    with app.app_context():
        team = gen_team(app.db, member_count=2)
        hero = HZU18Hero.query.filter_by(enabled=True).first()
        member = [user for user in team.members if user.id != team.captain_id][0]

        with login_as_user(app, name=member.name) as client:
            response = client.post(
                "/api/v1/hzu18/team/hero/confirm", json={"hero_id": hero.id}
            )
            assert response.status_code == 403
            assert HZU18TeamHeroPick.query.filter_by(team_id=team.id).first() is None
    destroy_ctfd(app)


def test_hzu18_hero_picks_stay_open_after_start_until_manually_locked():
    app = create_ctfd(user_mode="teams", enable_plugins=True)
    with app.app_context():
        team = gen_team(app.db, member_count=1)
        second_team = gen_team(
            app.db, name="late-team", email="late@examplectf.com", member_count=1
        )
        heroes = HZU18Hero.query.filter_by(enabled=True).limit(2).all()
        hero_id = heroes[0].id
        second_hero_id = heroes[1].id
        captain_name = team.captain.name
        second_captain_name = second_team.captain.name
        set_config("start", int(time.time()) - 10)

        with login_as_user(app, name=captain_name) as client:
            response = client.post(
                "/api/v1/hzu18/team/hero/confirm", json={"hero_id": hero_id}
            )
            assert response.status_code == 200

        set_config("hzu18_hero_picks_locked", "true")

        with login_as_user(app, name=second_captain_name) as client:
            response = client.post(
                "/api/v1/hzu18/team/hero/confirm", json={"hero_id": second_hero_id}
            )
            assert response.status_code == 403
            assert response.get_json()["errors"][""] == ["Hero picks are locked"]
    destroy_ctfd(app)


def test_hzu18_scoreboard_includes_picked_hero():
    app = create_ctfd(user_mode="teams", enable_plugins=True)
    with app.app_context():
        team = gen_team(
            app.db, name="team1", email="team1@examplectf.com", member_count=1
        )
        hero = HZU18Hero.query.filter_by(enabled=True).first()
        hero_id = hero.id
        team_id = team.id
        captain_id = team.captain.id
        captain_name = team.captain.name
        challenge = gen_challenge(app.db, value=100)
        challenge_id = challenge.id

        with login_as_user(app, name=captain_name) as client:
            client.post(
                "/api/v1/hzu18/team/hero/confirm", json={"hero_id": hero_id}
            )

        gen_solve(
            app.db,
            user_id=captain_id,
            team_id=team_id,
            challenge_id=challenge_id,
        )

        with app.test_client() as client:
            response = client.get("/api/v1/hzu18/scoreboard")
            assert response.status_code == 200
            standings = response.get_json()["data"]["standings"]
            assert standings[0]["team_id"] == team_id
            assert standings[0]["hero"]["id"] == hero_id
            assert standings[0]["score"] == 100
            assert standings[0]["solved_challenges"] == 1
    destroy_ctfd(app)


def test_hzu18_scoreboard_hides_unconfirmed_hero():
    app = create_ctfd(user_mode="teams", enable_plugins=True)
    with app.app_context():
        team = gen_team(
            app.db, name="team1", email="team1@examplectf.com", member_count=1
        )
        hero = HZU18Hero.query.filter_by(enabled=True).first()
        app.db.session.add(
            HZU18TeamHeroPick(
                team_id=team.id,
                hero_id=hero.id,
                picked_by_user_id=team.captain.id,
                locked=False,
            )
        )
        app.db.session.commit()

        with app.test_client() as client:
            response = client.get("/api/v1/hzu18/scoreboard")
            assert response.status_code == 200
            standings = response.get_json()["data"]["standings"]
            assert standings[0]["team_id"] == team.id
            assert standings[0]["hero"] is None
    destroy_ctfd(app)


def test_hzu18_result_scoreboard_ignores_freeze():
    app = create_ctfd(user_mode="teams", enable_plugins=True)
    with app.app_context():
        team = gen_team(
            app.db, name="team1", email="team1@examplectf.com", member_count=1
        )
        first_challenge = gen_challenge(app.db, value=100)
        second_challenge = gen_challenge(app.db, value=200)
        freeze = int(time.time())
        set_config("freeze", freeze)

        before_freeze = gen_solve(
            app.db,
            user_id=team.captain.id,
            team_id=team.id,
            challenge_id=first_challenge.id,
        )
        after_freeze = gen_solve(
            app.db,
            user_id=team.captain.id,
            team_id=team.id,
            challenge_id=second_challenge.id,
        )
        before_freeze.date = datetime.datetime.utcfromtimestamp(freeze - 10)
        after_freeze.date = datetime.datetime.utcfromtimestamp(freeze + 10)
        app.db.session.commit()
        clear_standings()

        with app.test_client() as client:
            frozen_response = client.get("/api/v1/hzu18/scoreboard")
            result_response = client.get("/api/v1/hzu18/scoreboard/result")

        frozen_row = frozen_response.get_json()["data"]["standings"][0]
        result_row = result_response.get_json()["data"]["standings"][0]
        assert frozen_row["score"] == 100
        assert frozen_row["solved_challenges"] == 1
        assert result_row["score"] == 300
        assert result_row["solved_challenges"] == 2
        assert result_response.get_json()["data"]["scoreboard_frozen"] is False
    destroy_ctfd(app)


def test_hzu18_solve_hook_emits_realtime_scoreboard_events():
    app = create_ctfd(user_mode="teams", enable_plugins=True)
    with app.app_context():
        team = gen_team(
            app.db, name="team1", email="team1@examplectf.com", member_count=1
        )
        hero = HZU18Hero.query.filter_by(enabled=True).first()
        challenge = gen_challenge(app.db, value=100)
        pick = HZU18TeamHeroPick(
            team_id=team.id,
            hero_id=hero.id,
            picked_by_user_id=team.captain.id,
            locked=True,
        )
        app.db.session.add(pick)
        app.db.session.commit()

        with app.test_request_context(
            json={"submission": "flag{demo}"},
            environ_base={"REMOTE_ADDR": "127.0.0.1"},
        ):
            BaseChallenge.solve(
                user=team.captain,
                team=team,
                challenge=challenge,
                request=request,
            )

        events = HZU18EventLog.query.order_by(HZU18EventLog.id.asc()).all()
        event_types = [event.event_type for event in events]
        assert event_types == ["flag_correct", "first_blood", "leader_changed"]
        assert events[0].payload["team_id"] == team.id
        assert events[0].payload["team_name"] == "team1"
        assert events[0].payload["challenge_id"] == challenge.id
        assert events[0].payload["score_delta"] == 100
        assert events[0].payload["new_score"] == 100
        assert events[0].payload["hero"]["id"] == hero.id
        assert events[2].payload["new_leader_team_id"] == team.id
    destroy_ctfd(app)


def test_hzu18_recent_events_support_since_id_replay():
    app = create_ctfd(user_mode="teams", enable_plugins=True)
    with app.app_context():
        first = record_event(
            "organizer_announcement",
            {"title": "First", "detail": "Before reconnect"},
        )
        second = record_event(
            "organizer_announcement",
            {"title": "Second", "detail": "After reconnect"},
        )
        app.db.session.commit()

        with app.test_client() as client:
            response = client.get(f"/api/v1/hzu18/events/recent?since_id={first.id}")
            assert response.status_code == 200
            data = response.get_json()["data"]
            assert [event["id"] for event in data] == [second.id]
            assert data[0]["payload"]["title"] == "Second"
    destroy_ctfd(app)
