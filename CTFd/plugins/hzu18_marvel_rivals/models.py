import datetime
import json

from CTFd.models import db


class HZU18Hero(db.Model):
    __tablename__ = "hzu18_heroes"

    id = db.Column(db.Integer, primary_key=True)
    slug = db.Column(db.String(64), unique=True, nullable=False)
    name = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(64), nullable=False, default="Flex")
    enabled = db.Column(db.Boolean, nullable=False, default=True)
    sort_order = db.Column(db.Integer, nullable=False, default=0)
    portrait_path = db.Column(db.Text)
    sound_path = db.Column(db.Text)
    theme_color = db.Column(db.String(16), nullable=False, default="#2dd4bf")
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    picks = db.relationship(
        "HZU18TeamHeroPick",
        back_populates="hero",
        cascade="all, delete-orphan",
        lazy="select",
    )

    def to_dict(self, include_enabled=True):
        data = {
            "id": self.id,
            "slug": self.slug,
            "name": self.name,
            "role": self.role,
            "sort_order": self.sort_order,
            "portrait_path": self.portrait_path,
            "sound_path": self.sound_path,
            "theme_color": self.theme_color,
        }
        if include_enabled:
            data["enabled"] = self.enabled
        return data


class HZU18TeamHeroPick(db.Model):
    __tablename__ = "hzu18_team_hero_picks"

    id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(
        db.Integer, db.ForeignKey("teams.id", ondelete="CASCADE"), unique=True
    )
    hero_id = db.Column(db.Integer, db.ForeignKey("hzu18_heroes.id", ondelete="CASCADE"))
    picked_by_user_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="SET NULL")
    )
    picked_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    locked = db.Column(db.Boolean, nullable=False, default=False)

    hero = db.relationship("HZU18Hero", back_populates="picks", lazy="joined")
    team = db.relationship("Teams", foreign_keys=[team_id], lazy="joined")
    picked_by = db.relationship("Users", foreign_keys=[picked_by_user_id], lazy="select")

    def to_dict(self):
        return {
            "id": self.id,
            "team_id": self.team_id,
            "hero_id": self.hero_id,
            "picked_by_user_id": self.picked_by_user_id,
            "picked_at": self.picked_at.isoformat() + "Z" if self.picked_at else None,
            "locked": self.locked,
            "hero": self.hero.to_dict() if self.hero else None,
        }


class HZU18EventLog(db.Model):
    __tablename__ = "hzu18_event_log"

    id = db.Column(db.Integer, primary_key=True)
    event_type = db.Column(db.String(80), nullable=False)
    payload_json = db.Column(db.Text, nullable=False, default="{}")
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    visible_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    replayable = db.Column(db.Boolean, nullable=False, default=True)

    @property
    def payload(self):
        try:
            return json.loads(self.payload_json or "{}")
        except (TypeError, ValueError):
            return {}

    def to_dict(self):
        return {
            "id": self.id,
            "event_type": self.event_type,
            "payload": self.payload,
            "created_at": self.created_at.isoformat() + "Z"
            if self.created_at
            else None,
            "visible_at": self.visible_at.isoformat() + "Z"
            if self.visible_at
            else None,
            "replayable": self.replayable,
        }
