let express = require('express');
let bodyParser = require('body-parser');
let ParseServer = require('parse-server').ParseServer;
let GCSAdapter = require('parse-server-gcs-adapter');
let ParseDashboard = require('parse-dashboard');
let path = require('path');
let OneSignalPushAdapter = require('parse-server-onesignal-push-adapter');

let databaseUri = process.env.MONGODB_URI;

if (!databaseUri) {
    console.log('DATABASE_URI not specified, falling back to localhost.');
}

/////// Google Cloud Storage ///////

let gcsAdapter = new GCSAdapter(
    process.env.GCP_PROJECT_ID || 'parseServer',
    process.env.GCP_SERVICE_KEY_FILE || (__dirname + '/keys/parseServer-f671e7c90267.json'),
    process.env.GCS_BUCKET || 'parseServer', {
        bucketPrefix: '',
        directAccess: false
    });

///////////////////////////////////

/*let oneSignalPushAdapter = new OneSignalPushAdapter({
    oneSignalAppId: process.env.ONESIGNAL_APP_ID || '',
    oneSignalApiKey: process.env.ONESIGNAL_API_KEY || ''
});
*/
let parseServer = new ParseServer({
    databaseURI: databaseUri || 'mongodb://heroku_p58pfjpg:ljpk1v2qsv78auvdfovnaralgj@ds217125.mlab.com:17125/heroku_p58pfjpg',
    cloud: __dirname + '/cloud/main.js',
    appId: process.env.APP_ID || 'parseServer',
    masterKey: process.env.MASTER_KEY || 'parseServer_554312345',
    serverURL: (process.env.SERVER_URL || 'http://localhost:1337') + '/parseServer',
    filesAdapter: gcsAdapter,
    production: true,
    liveQuery: {
        classNames: [] // List of classes to support for query subscriptions
    },
    /*push: {
        adapter: oneSignalPushAdapter
    }*/

});

let allowInsecureHTTP = true;

let parseDashboardSettings = {
    apps: [
        {
            serverURL: (process.env.SERVER_URL || 'http://localhost:1337') + '/parseServer',
            appId: process.env.APP_ID || 'parseServer',
            masterKey: process.env.MASTER_KEY || 'parseServer_554312345',
            appName: process.env.APP_NAME || "parseServer",
            iconName: "icon.png",
            production: true
        }
    ],
    users: [
        {
            user: "trevor",
            pass: "trevor123!@#",
            masterKey: process.env.MASTER_KEY || 'parseServer_554312345',
            apps: [
                {
                    appId: process.env.APP_ID || 'parseServer'
                }
            ]
        },
        {
            user: "jeff",
            pass: "jeff123!@#",
            masterKey: process.env.MASTER_KEY || 'parseServer_554312345',
            apps: [
                {
                    appId: process.env.APP_ID || 'parseServer'
                }
            ]
        },
        {
            user: process.env.ADMINUSERNAME || 'admin',
            pass: process.env.ADMINPASSWORD || 'Money123@66123',
            masterKey: process.env.MASTER_KEY || 'parseServer_554312345',
            apps: [
                {
                    appId: process.env.APP_ID || 'parseServer'
                }
            ]
        }
    ],
    iconsFolder: "files/icons"
};


let dashboard = new ParseDashboard(parseDashboardSettings, allowInsecureHTTP);

let app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


app.get('/', function (req, res) {
    res.status(200).send('parseServer resource. For authorised persons only!');
});

app.use('/dashboard', dashboard);

app.use('/parseServer', parseServer, function (req, res, next) {
    return next();
});

let port = process.env.PORT || 1337;
let httpServer = require('http').createServer(app);
httpServer.listen(port, function () {
    console.log('parseServer running on port ' + port + '.');
});

ParseServer.createLiveQueryServer(httpServer);

