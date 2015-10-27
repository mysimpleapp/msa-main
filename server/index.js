var indexApp = module.exports = App.subApp();

// template
var fs = require('fs');
var mustache = require('mustache');
var template = fs.readFileSync(__dirname+'/views/index.html', "utf8");
mustache.parse(template);

// default route
indexApp.get("/", function(req, res, next) {
	req.url = "/sheet";
	req.query = { key:"home" }
	next();
});

// fill res with partial (in function of route)
/*for(var name in App.routes) {
	(function(name){
		var subApp = App.require(name);
		if(subApp===indexApp) return;
		indexApp.use("/"+name, function(req, res, next) {
			// update url by prepending "partial"
			var originalUrl = req.url;
			req.url = "/partial"+req.url;
			subApp(req, res, function(err){
				// put back original url (without "partial")
				req.url = originalUrl;
				next(err);
			});
		});
	}(name));
}*/
/*for(var routeName in App.routes) {
	(function(routeName){
		var subApp = App.getSubAppFromRouteName(routeName);
		if(!subApp || subApp===indexApp) return;
		indexApp.use("/"+routeName, function(req, res, next) {
			// change methid to "PARTIAL"
			var originalMethod = req.method;
			req.method = "PARTIAL";
			subApp(req, res, function(err){
				// put back original method
				req.method = originalMethod;
				next(err);
			});
		});
	}(routeName));
}*/

// import some middlewares
App.use(require("body-parser").json());

// subApp routing
for(var routeName in App.routes) {
	var subApp = App.getSubAppFromRouteName(routeName);
	if(subApp) indexApp.use("/"+routeName, subApp);
}

// render view with partial content
indexApp.get('*', function(req, res, next) {
	if(!res.partial) return next();
	res.setHeader('content-type', 'text/html');
	var html = mustache.render(template, {partial:res.partial});
//console.log(html)
	res.send(html);
});

// static routing
indexApp.use(App.express.static(App.dirname));