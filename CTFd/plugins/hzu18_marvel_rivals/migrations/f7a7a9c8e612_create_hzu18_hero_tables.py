"""Create HZU18 hero selection tables

Revision ID: f7a7a9c8e612
Revises:
Create Date: 2026-04-29 00:00:00.000000

"""
import sqlalchemy as sa

from CTFd.plugins.migrations import get_all_tables

revision = "f7a7a9c8e612"
down_revision = None
branch_labels = None
depends_on = None


def upgrade(op=None):
    tables = get_all_tables(op)

    if "hzu18_heroes" not in tables:
        op.create_table(
            "hzu18_heroes",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("slug", sa.String(length=64), nullable=False),
            sa.Column("name", sa.String(length=128), nullable=False),
            sa.Column("role", sa.String(length=64), nullable=False),
            sa.Column("enabled", sa.Boolean(), server_default=sa.true(), nullable=False),
            sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
            sa.Column("portrait_path", sa.Text(), nullable=True),
            sa.Column("sound_path", sa.Text(), nullable=True),
            sa.Column("theme_color", sa.String(length=16), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("slug"),
        )

    if "hzu18_team_hero_picks" not in tables:
        op.create_table(
            "hzu18_team_hero_picks",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("team_id", sa.Integer(), nullable=True),
            sa.Column("hero_id", sa.Integer(), nullable=True),
            sa.Column("picked_by_user_id", sa.Integer(), nullable=True),
            sa.Column("picked_at", sa.DateTime(), nullable=True),
            sa.Column("locked", sa.Boolean(), server_default=sa.false(), nullable=False),
            sa.ForeignKeyConstraint(["hero_id"], ["hzu18_heroes.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["picked_by_user_id"], ["users.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["team_id"], ["teams.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("team_id"),
        )

    if "hzu18_event_log" not in tables:
        op.create_table(
            "hzu18_event_log",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("event_type", sa.String(length=80), nullable=False),
            sa.Column("payload_json", sa.Text(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("visible_at", sa.DateTime(), nullable=True),
            sa.Column("replayable", sa.Boolean(), server_default=sa.true(), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        )


def downgrade(op=None):
    tables = get_all_tables(op)
    if "hzu18_event_log" in tables:
        op.drop_table("hzu18_event_log")
    if "hzu18_team_hero_picks" in tables:
        op.drop_table("hzu18_team_hero_picks")
    if "hzu18_heroes" in tables:
        op.drop_table("hzu18_heroes")
