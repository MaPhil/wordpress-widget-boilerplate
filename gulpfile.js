
var gulp = require('gulp'),
config = require('./config'),
exec = require('child_process').exec,
build = require('./build_script/index'),
fs = require('fs');

let path = `${__dirname}/dist/${config.widget_name.replace(/\s+/gm,'')}`;

// Compile Our Sass
gulp.task('build', async () => {


  var out = `<?php
  class wp_wt_${config.widget_name.replace(/\s+/gm,'')} extends WP_Widget {
    protected $defaults;
    function __construct(){
      ${await build.general_info(config)}
    }
    public function widget($args, $instance){
      ${await build.widget_basis(config)}
      echo $args['before_widget'];`;
      var template = await build.template(fs,config);

      for(var i=0;i<template.length;i++){
        if(template[i].kind=='php')out +=`\n${template[i].value}\n`;
        else out +=`\necho '${template[i].value.replace(/\r?\n|\r/g,'')}';\n`;
      }
      out +=`
      echo $args['after_widget'];
    }
    public function form($instance){
      ${await build.form(config)}
    }
    public function update($new_instance, $old_instance){
      ${await build.update(config)}
    }
  }
  `;
  fs.writeFileSync(`${path}/widget.php`, out);
  return true;
});
gulp.task('assemble', async () => {
  await exec(`mkdir -p ${path}/assets`);
  for(var i=0;i<config.scripts.length;i++){
    var s = config.scripts[i];
    if(s.kind =='style') await exec(`cp ${__dirname}/css/${s.file} ${path}/assets/${s.file}`);
    else await exec(`cp ${__dirname}/js/${s.file} ${path}/assets/${s.file}`)
  }
  return true;
});

gulp.task('ensureFolder', async () =>{
  await exec(`mkdir -p ${path}`);
  return true;
});

gulp.task('watch', function () {
  gulp.watch('config.js', ['build','assemble']);
  gulp.watch('html/index.js',['build','assemble']);
  gulp.watch('css/**/*.css',['assemble']);
  gulp.watch('js/**/*.js',['assemble']);
});


gulp.task('default', ['build','assemble','watch']);
