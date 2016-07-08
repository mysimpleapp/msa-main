var mainApp = module.exports = App.subApp()

var navmenuApp = require("../../msa-navmenu/server")
var userApp = require("../../msa-user/server")

// template
var fs = require('fs');
var mustache = require('mustache');
var template = fs.readFileSync(__dirname+'/views/index.html', "utf8");
mustache.parse(template);

mainApp.get("*", function(req, res, next) {
	next();
});

// default route
mainApp.get("/", function(req, res, next) {
	req.url = "/page/home";
	next();
});

// import some middlewares
App.use(require("body-parser").json());

// partialApp
var partialApp = App.subApp();
mainApp.use("/partial", partialApp);

// subApp routing
/*for(var routeName in App.routes) {
	var subApp = App.getSubAppFromRouteName(routeName);
	if(subApp) {
		mainApp.use("/"+routeName, subApp);
		partialApp.use("/"+routeName, subApp);
	}
}*/
mainApp.use(App.subAppsRouter)
partialApp.use(App.subAppsRouter)

// render view with partial content
mainApp.get('*', function(req, res, next) {
	// check if a sub app have replied a partial
	if(!res.partial) return next();
	var contentPartial = res.partial
	delete res.partial
	// get partial from navmenu
	navmenuApp.getAsPartial(req, res, function(){
		if(!res.partial) return next();
		var headerPartial = res.partial
		delete res.partial
		// get partial form user
		userApp.getAsPartial(req, res, function(){
			if(!res.partial) return next();
			var userPartial = res.partial
			delete res.partial
			// send content
			res.setHeader('content-type', 'text/html')
			var html = mustache.render(template, { headerPartial:headerPartial, userPartial:userPartial, contentPartial:contentPartial })
			res.send(html)
		})
	})
})

// render partial as ajax
partialApp.get("*", function(req, res, next) {
	if(!res.partial) return next();
	res.json(res.partial)
})

// static routing
mainApp.use(App.express.static(App.dirname));
