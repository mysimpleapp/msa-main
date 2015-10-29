var mainApp = module.exports = App.subApp();

// template
var fs = require('fs');
var mustache = require('mustache');
var template = fs.readFileSync(__dirname+'/views/index.html', "utf8");
mustache.parse(template);

// default route
mainApp.get("/", function(req, res, next) {
	req.url = "/sheet";
	req.query = { key:"home" }
	next();
});

// import some middlewares
App.use(require("body-parser").json());

// subApp routing
for(var routeName in App.routes) {
	var subApp = App.getSubAppFromRouteName(routeName);
	if(subApp) mainApp.use("/"+routeName, subApp);
}

// render view with partial content
mainApp.get('*', function(req, res, next) {
	if(!res.partial) return next();
	res.setHeader('content-type', 'text/html');
	var html = mustache.render(template, {partial:res.partial});
	res.send(html);
});

// static routing
mainApp.use(App.express.static(App.dirname));