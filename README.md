# Welcome to the Widget Boilerplate!

The wordpress widget boilerplate system is designed to create awesome widgets for wordpress and to reduce the knowledge you need to only html, css and javascript.

# Getting started
The system relies on nodejs to _"compile"_ the html you wrote to a widget, this means you need to install nodejs first (I use the version 8 lts). 
Additionally you will need to install gulp, since this preprocessor library is used ontop of nodejs. You can install it by using the **npm i -g gulp**. This will enable you to use gulp globally in your system. If you do not know gulp you should check it out its awesome.

Now you need to clone this repository and install all dependencies by using **npm i** inside the cloned folder.

## Setting up the config file
After you have installed everything you need to set environment path in the **config.js** file. You will need to add the path to the **widgets** folder inside you [wordpress-widget-theme](https://github.com/MaPhil/wordpress-widget-theme) folder to the variable **path_to_widget_folder** and you need to set the variable **use_dist_folder** to false. Your file could look something linke this: 

    'use strict';
    
    var variables = require('./configuration/variables');
    var scripts = require('./configuration/scripts');
    
    module.exports = {
    	widget_name:'test1', //only a-z, A-Z, 0-9 und _
    	widget_description:'',
    	use_dist_folder:false, //if set to false the path to the widget folder needs to be supplied
    	path_to_widget_folder:'/Users/<username>/Desktop/varion/wordpress/wordpress-widget-theme/widgets',
    	version:'0.0.1',
    	id:'00001',
    	scripts:scripts,
    	variables:variables
    } 
As you have probably already seen you need to create a new directory and 2 new files to configure the scripts that should be loaded and the variables for the admin panel.
You will need to create the directory **configuration** and in this directory you will need to create the file **variables.js** and **scripts.js**.

The **variables.js** will contain the configuration for all you variables and it should look something like this: 

    module.exports = [{
    	name:'testName',
    	kind:'text',
    	title:'Title',
    	default:'this is a test'
    }]
As kind you can use the following tags: color, date, datetime-local, email, text, month, number, range, number, tel, time, url, week, title, media, boolean and rich-text.
If you want to use a gallery you will first need to install the [gallery plugin](https://github.com/MaPhil/wordpress-widget-gallery).

The **scripts.js** will manage all the scripts that should be loaded to the frontend. This file should look something like this: 

    module.exports = [{
		kind:'style',
		name:'style',
		source:0,
		file:'style.css'
	},{
		kind:'script',
		name:'code',
		source:0,
		file:'test.js'
	}]

 If you want to integrate files that are in the scripts/style folder you need to need to use source = 0. If the source comes from the assets folder becouse it has more than one file you need to use source = 1 and for completely external sources you need to write source = 3.

## Write your widgets

After you have done all this you can run the command **gulp** inside the folder and start working on the html.

#### Using variables

While you are writing your widget you might want to use the admin panel input. To do so you will need to add some specific syntax. HTML code with this syntax will look like followed:

    <div class="presentation">{{variableName}}</div>

The {{}} syntax can be used anywhere in the HTML

#### Using if variable

When you want to display something only if the variable input is right you will need to use the if statement. 

    wgt_if:start[variableName="true"]
    
    <div class="caption">
	    {{captionVariable}}
    </div>
    
    wgt_if:end[variableName]
You can check for every string with this syntax.

#### using for loops on galleries
When you are using the gallery plugin you can add a for loop into you HTML.

    wgt_for:start[gallery]
    <div class="slide slide_index_{{gallery.index}}">
    	<img width="100%" src="{{gallery.path}}"/>
    </div> 
    wgt_for:end[gallery]
The gallery has inside the loop an index, the path, a caption and a sub_caption.
