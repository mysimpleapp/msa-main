var msaMain = module.exports = {}
var mainApp = msaMain.subApp = Msa.subApp()

var msaNavmenu = require("../../msa-navmenu/msa-server")
var msaUser = require("../../msa-user/msa-server")

var formatHtml = Msa.formatHtml

// template
var path = require('path'),
	join = path.join
var fs = require('fs')
var mustache = require('mustache')
var template = fs.readFileSync(join(__dirname, 'views/index.html'), "utf8")
mustache.parse(template)

// default route
msaMain.setDefaultRoute = function(next) {
	msaUser.isFirstRegisterDone(function(err, done) {
		if(err) return next(err)
		if(done) msaMain.defaultRoute = "/page/home"
		else {
			msaMain.defaultRoute = "/user/firstregister"
			msaUser.onFirstRegister = function(next) {
				msaMain.setDefaultRoute(next)
			}
		}
		next && next()
	})
}
msaMain.setDefaultRoute(function(err) {
	if(err) console.log(err)
})

// log
if(Msa.params.log_level==="DEBUG") {
	mainApp.use(function(req, res, next) {
		console.log(req.method+' '+req.url)
		next()
	})
}

mainApp.get("/", function(req, res, next) {
	res.redirect(msaMain.defaultRoute)
})

// import some middlewares
Msa.app.use(require("body-parser").json())

// partialApp
var partialApp = Msa.subApp()
mainApp.use("/partial", partialApp)

// mainApp routing
mainApp.use(Msa.subAppsRouter)
partialApp.use(Msa.subAppsRouter)

// render view with partial content
var mainGet = function(req, res, next) {
	// check if a sub app have replied a partial
	if(res.partial===undefined) return next()
	var contentPartial = formatHtml(res.partial)
	delete res.partial
	// get partial from navmenu
	msaNavmenu.getPartial(req, res, function(){
		_mainGet2(contentPartial, req, res, next)
	})
}
var _mainGet2 = function(contentPartial, req, res, next) {
	if(res.partial===undefined) return next("No partial returned from navmenu component.")
	var headerPartial = formatHtml(res.partial)
	delete res.partial
	// get partial form user
	msaUser.getPartial(req, res, function(){
		_mainGet3(contentPartial, headerPartial, res, next)
	})
}
var _mainGet3 = function(contentPartial, headerPartial, res, next) {
	if(res.partial===undefined) return next("No partial returned from user component.")
	var userPartial = formatHtml(res.partial)
	delete res.partial
	// send content
	res.setHeader('content-type', 'text/html')
	var html = mustache.render(template, {
		headerPartial: headerPartial,
		userPartial: userPartial,
		contentPartial: contentPartial
	})
	res.send(html)
}
mainApp.get('*', mainGet)

// render partial as ajax
partialApp.get('*', function(req, res, next) {
	if(!res.partial) return next()
	res.json(res.partial)
})

// forbid msa-server content
mainApp.get('*/msa-server/*', function(req, res, next){
	next(403) // 403 = Forbidden
})

// static routing
mainApp.use(Msa.express.static(Msa.dirname))

// error handling
mainApp.use(function(err, req, res, next){
	// determine error code & text
	if(typeof err=='object') {
		if(err instanceof Error) var text=err
		else var code=err.code, text=err.text

	} else if(typeof err=='number') var code=err
	else var text=err
	if(!code) code=500
	if(!text) text=''
	// respond to client
	res.sendStatus(code)
	// log error
	if(Msa.params.log_level==="DEBUG") {
		console.error('ERROR', code, text)
	}
})
