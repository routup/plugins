window.onload = function () {
    var options = <% swaggerOptions %>;

    var oauth = options.oauth;
    var authAction = options.authAction;

    delete options.oauth;
    delete options.authAction;

    var swaggerOptions = {
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIStandalonePreset,
        ],
        plugins: [
            SwaggerUIBundle.plugins.DownloadUrl,
        ],
        layout: 'BaseLayout',
    };

    Object.keys(options).forEach(function (key) {
        swaggerOptions[key] = options[key];
    });

    var ui = SwaggerUIBundle(swaggerOptions);

    if (oauth) {
        ui.initOAuth(oauth);
    }

    if (authAction) {
        ui.authActions.authorize(authAction);
    }

    window.ui = ui;
};
