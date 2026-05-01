from CTFd.plugins import (
    register_admin_plugin_menu_bar,
    register_plugin_assets_directory,
    register_user_page_menu_bar,
)
from CTFd.plugins.migrations import upgrade

from .helpers import install_solve_event_hook, seed_default_heroes
from .routes import hzu18_admin, hzu18_api, hzu18_pages


def load(app):
    upgrade(plugin_name="hzu18_marvel_rivals")
    seed_default_heroes()
    install_solve_event_hook()

    app.register_blueprint(hzu18_api)
    app.register_blueprint(hzu18_admin)
    app.register_blueprint(hzu18_pages)

    register_plugin_assets_directory(
        app, base_path="/plugins/hzu18_marvel_rivals/assets/"
    )
    register_user_page_menu_bar("Hero", "/hero")
    register_admin_plugin_menu_bar("HZU18 Heroes", "/admin/hzu18/heroes")
