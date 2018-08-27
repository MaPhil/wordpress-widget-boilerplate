
var gulp = require('gulp'),
config = require('./config'),
exec = require('child_process').exec,
build = require('./build_script/index'),
fs = require('fs');

let path = `${__dirname}/dist/${config.widget_name.replace(/\s+/gm,'')}`;

if(config.use_dist_folder == false) path = `${config.path_to_widget_folder}/${config.widget_name.replace(/\s+/gm,'')}`;


var ensurePath = () =>{
  return new Promise(resolve=>{
    exec(`mkdir -p ${path}`,()=>{
      exec(`touch ${path}/widget.php`,()=>{
        resolve();
      });
    })
  })
};


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
        else out +=`\?> ${template[i].value.replace(/\r?\n|\r/g,'')} <?php\n`;
      }
      out +=`
      echo $args['after_widget'];
    }
    public function enqueue_admin_scripts() {
      wp_enqueue_editor();
      wp_enqueue_media();
    }
    public function form($instance){
      ${await build.form(config)}
    }
    public function update($new_instance, $old_instance){
      ${await build.update(config)}
    }
  }
  `;
  ensurePath().then(()=>{
    fs.writeFileSync(`${path}/widget.php`, out);
    return true;
  })
});
gulp.task('assemble', async () => {
  await exec(`mkdir -p ${path}/assets`);
  await exec(`cp -r ${__dirname}/assets ${path}/`)
    for(var i=0;i<config.scripts.length;i++){
      var s = config.scripts[i];
      if(!s.source || s.source == 0){
        if(s.kind =='style') await exec(`cp ${__dirname}/css/${s.file} ${path}/assets/${s.file}`);
        else await exec(`cp ${__dirname}/js/${s.file} ${path}/assets/${s.file}`)
      }
  }
  return true;
});

gulp.task('reload',function(){
  exec('gulp',function(){
    process.exit();
  })
})
gulp.task('watch', function () {

  gulp.watch('configuration/*.js',['reload']);
  gulp.watch('html/index.html',['build','assemble']);
  gulp.watch('css/**/*.css',['assemble']);
  gulp.watch('js/**/*.js',['assemble']);
});


gulp.task('default', ['build','assemble','watch']);
