var mainApp = module.exports = Msa.subApp()

var navmenuApp = require("../../msa-navmenu/msa-server")
var userApp = require("../../msa-user/msa-server")

// template
var fs = require('fs')
var mustache = require('mustache')
var template = fs.readFileSync(__dirname+'/views/index.html', "utf8")
mustache.parse(template)

/*mainApp.get("*", function(req, res, next) {
	next();
});*/

// default route
mainApp.setDefaultRoute = function(next) {
	userApp.isFirstRegisterDone(function(err, done) {
		if(err) return next(err)
		if(done) mainApp.defaultRoute = "/page/home"
		else {
			mainApp.defaultRoute = "/user/firstregister"
			userApp.onFirstRegister = function(next) {
				mainApp.setDefaultRoute(next)
			}
		}
		next && next()
	})
}
mainApp.setDefaultRoute()

mainApp.get("/", function(req, res, next) {
	res.redirect(mainApp.defaultRoute)
})

// import some middlewares
Msa.app.use(require("body-parser").json())

// partialApp
var partialApp = Msa.subApp()
mainApp.use("/partial", partialApp)

// subApp routing
/*for(var routeName in App.routes) {
	var subApp = App.getSubAppFromRouteName(routeName);
	if(subApp) {
		mainApp.use("/"+routeName, subApp);
		partialApp.use("/"+routeName, subApp);
	}
}*/
mainApp.use(Msa.subAppsRouter)
partialApp.use(Msa.subAppsRouter)

// render view with partial content
mainApp.get('*', function(req, res, next) {
	// check if a sub app have replied a partial
	if(!res.partial) return next()
	var contentPartial = Msa.solveHtmlExpr(res.partial)
	delete res.partial
	// get partial from navmenu
	navmenuApp.getPartial(req, res, function(){
		if(!res.partial) return next();
		var headerPartial = Msa.solveHtmlExpr(res.partial)
		delete res.partial
		// get partial form user
		userApp.getPartial(req, res, function(){
			if(!res.partial) return next();
			var userPartial = Msa.solveHtmlExpr(res.partial)
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
	if(!res.partial) return next()
	res.json(res.partial)
})

// static routing
mainApp.use(Msa.express.static(Msa.dirname))
