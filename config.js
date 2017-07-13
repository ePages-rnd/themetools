var path = require('path'),
    osenv = require('osenv'),
    fs = require('fs-extra'),
    configFile = path.resolve(osenv.home(), '.epages-config');
module.exports = fs.readJsonSync(configFile);