
'use strict';

var variables = require('./configuration/variables');
var scripts = require('./configuration/scripts');

module.exports = {
	widget_name:'test1', //only a-z, A-Z, 0-9 und _
	widget_description:'',
	use_dist_folder:false, //if set to false the path to the widget folder needs to be supplied
	path_to_widget_folder:'/Users/philipp/Desktop/varion/wordpress/wordpress-widget-theme/widgets',
	version:'0.0.1',
	id:'00001',
	scripts:scripts,
	variables:variables
} 