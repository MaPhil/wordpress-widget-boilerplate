'use strict';
var _ = require('lodash');
var hasTitle = false;
var titleName = '';

async function handleVariables(v,content,prefix){

	let out = [];
	let tc = content.split(new RegExp(`{{${v.name}\..+}}`,'gm'));
	let tm = content.match(new RegExp(`{{${v.name}\..+}}`,'gm'));
	if(!prefix){
		tc = content.split(new RegExp(`{{${v.name}}}`,'gm'));
		tm = content.match(new RegExp(`{{${v.name}}}`,'gm'));
	}
	let count1 = 0,
	count2 = 0;
	if(tm==null){
		out.push({
			kind:'string',
			value:content
		});
		return out;
	}
	if(tc[count1] && tc[count1] != ''){
		out.push({
			kind:'string',
			value:tc[count1]
		})
	}
	count1++;
	while(count1<tc.length){
		
		if(prefix){

			let tk = tm[count2].match(/\..+[^}]/gm)[0].substr(1);
			if(tk == 'index'){
				out.push({
					kind:'php',
					value:`
					echo $${v.name}_count;
					`
				})
			}else{
				out.push({
					kind:'php',
					value:`
					if (  empty( $item_${v.name}->${tk} ) ) echo '${v.default}';
					else echo $item_${v.name}->${tk};
					`
				})
			}
			
		}else{
			out.push({
				kind:'php',
				value:`
				if (  empty( $${v.name} ) ) echo '${v.default}';
				else echo $${v.name};
				`
			})
		}
		count2++;

		if(tc[count1] && tc[count1] != ''){
			out.push({
				kind:'string',
				value:tc[count1]
			})
		}
		count1++;
	}

	return out;
}

async function splitFor(rs,c,v){
	let rg = new RegExp(`${rs.start}${rs.middle}${rs.end}`,'gm'),
	r1= new RegExp(rs.start,'gm'),
	r2= new RegExp(rs.end,'gm'),
	t = c.value.split(rg),
	match = c.value.match(rg),
	out = [],
	count1 = 0,
	count2 = 0;
	if(match == null) return false;
	if(t[count1] && t[count1] != ''){
		out.push({
			kind:'string',
			value:t[count1]
		})
	}
	count1++;
	while(count1<t.length && count2<match.length){
		
		var ma = match[count2].replace(r1,'').replace(r2,'');	
		out.push({
			kind:'php',
			value:`
			$${v.name}_count = 0;
			foreach ($${v.name} as $item_${v.name}){`
			})	
		let tmaRes = await handleVariables(v,ma,true);

		for(var i=0;i<tmaRes.length;i++) out.push(tmaRes[i]);

			out.push({
				kind:'php',
				value:`
				$${v.name}_count++;
			}`
		})
		count2++;
		if(t[count1] && t[count1] != ''){
			out.push({
				kind:'string',
				value:t[count1]
			})
		}
		count1++;
	}
	return out;
}
async function splitIf(rs,c,v){
	let flag = true;

	let rstart= new RegExp(rs.start,'gm'),
	rend= new RegExp(rs.end,'gm');

	let out =[];

	let count1 = 0,
	count2 = 0;

	let splitStart = c.value.split(rstart),
	matchStart = c.value.match(rstart);

	if(matchStart != null){
		if(splitStart[count1] && splitStart[count1] != ''){
			out.push({
				kind:'string',
				value:splitStart[count1]
			})
		}
		count1++;
		while(count1<splitStart.length && count2<matchStart.length){
			var query = matchStart[count2].match(rstart)[0].match(/(?:'|").+(?:'|")/gm)[0];
			var ma = matchStart[count2].replace(rstart,'');	
			out.push({
				kind:'php',
				value:`if($${v.name} == ${query}){`
				})	
			count2++;
			if(splitStart[count1] && splitStart[count1] != ''){
				out.push({
					kind:'string',
					value:splitStart[count1]
				})
			}
			count1++;
		}
	}else{
		flag = false;
		out = [c];	
	}
	for(var i=0;i<out.length;i++){
		if(out[i].kind == 'string' && out[i].value.match(rend) != null){
			flag = true;
			var temp = [];
			let count1 = 0,
			count2 = 0;

			let splitEnd = out[i].value.split(rend),
			matchEnd = out[i].value.match(rend);
			
			if(splitEnd[count1] && splitEnd[count1] != ''){
				temp.push({
					kind:'string',
					value:splitEnd[count1]
				})
			}
			count1++;
			while(count1<splitEnd.length && count2<matchEnd.length){
				temp.push({
					kind:'php',
					value:`}`
				})	
				count2++;
				if(splitEnd[count1] && splitEnd[count1] != ''){
					temp.push({
						kind:'string',
						value:splitEnd[count1]
					})
				}
				count1++;
			}
			out.splice(i,1,temp);
			i+=temp.length;
			out = _.flatten(out);	
		}
	}
	if(flag)return out;
	else return flag;
}
async function createForm(vl){
	var out = '';
	for(var i=0;i<vl.length;i++){
		if(['color','date','datetime-local','email','text','month','number','range','number','tel','time','url','week'].indexOf(vl[i].kind) != -1){
			out+=`
			<p>
			<label for="<?php echo $this->get_field_id( '${vl[i].name}' ); ?>">
			<?php _e( '${vl[i].title}:' ); ?>
			</label>
			<input class="widefat" id="<?php echo $this->get_field_id( '${vl[i].name}' ); ?>" name="<?php echo $this->get_field_name( '${vl[i].name}' ); ?>" type="${vl[i].kind}" value="<?php echo esc_attr( $${vl[i].name} ); ?>" />
			</p>
			`;
		}else if(vl[i].kind == 'title'){
			out+=`
			<p>
			<label for="<?php echo $this->get_field_id( '${vl[i].name}' ); ?>">
			<?php _e( '${vl[i].title}:' ); ?>
			</label>
			<input class="widefat" id="<?php echo $this->get_field_id( '${vl[i].name}' ); ?>" name="<?php echo $this->get_field_name( '${vl[i].name}' ); ?>" type="text" value="<?php echo esc_attr( $${vl[i].name} ); ?>" />
			</p>
			`;
		}else if(vl[i].kind == 'boolean'){
			out+=`
			<p>
			<input class="checkbox" type="checkbox" <?php checked( $instance[ '${vl[i].name}' ], 'true' ); ?> id="<?php echo $this->get_field_id( '${vl[i].name}' ); ?>" name="<?php echo $this->get_field_name( '${vl[i].name}' ); ?>" /> 
			<label for="<?php echo $this->get_field_id( '${vl[i].name}' ); ?>">${vl[i].title}</label>
			</p>
			`;
		}else if(vl[i].kind == 'rich-text'){
			out+=`
			<p>
			<button class="wp-wt-open-editor" related="<?php echo $this->get_field_id( '${vl[i].name}' ); ?>"><?php _e( '${vl[i].title}' ); ?></button>
			<input class="widefat" id="<?php echo $this->get_field_id( '${vl[i].name}' ); ?>" name="<?php echo $this->get_field_name( '${vl[i].name}' ); ?>" type="hidden" value="<?php echo esc_attr( $${vl[i].name} ); ?>" />
			</p>
			`;
		}else if(vl[i].kind == 'media'){
			out+=` 
			<p>
			<div id="display-media-upload-btn<?php echo $this->get_field_id( '${vl[i].name}' ); ?>" style="height: 150px;    margin-bottom: 5px;background-size: cover;background-image:url(\'<?php echo esc_attr( $${vl[i].name} ); ?>\')"></div> 
			<button class="button button-secondary media-upload-btn"  id="media-upload-btn<?php echo $this->get_field_id( '${vl[i].name}' ); ?>"><?php _e( '${vl[i].title}' ); ?> </button>
			<input  value="<?php echo esc_attr( $${vl[i].name} ); ?>" class="widefat" name="<?php echo $this->get_field_name( '${vl[i].name}' ); ?>" type="hidden"   id="<?php echo $this->get_field_id( '${vl[i].name}' ); ?>"/>
			</p>
			`;
		}else if(vl[i].kind == 'gallery'){
			out+=`
			<p>
			<label for="<?php echo $this->get_field_id( '${vl[i].name}' ); ?>">  
			<?php _e( '${vl[i].title}' ); ?>
			</label>
			<select class='widefat' id="<?php echo $this->get_field_id('${vl[i].name}'); ?>"
			name="<?php echo $this->get_field_name('${vl[i].name}'); ?>" type="text">
			<?php 
			foreach($results as $res){
				echo '<option value="';
				echo $res->id .'" ';
				echo ($${vl[i].name}=="$res->id")?'selected':'';
				echo '>'.$res->name.'</option>';
			}
			?>
			</select>
			</p>
			`;
		}
	}
	return out;
}


module.exports = {

	widget_basis: async(config)=>{
		var out ='extract($args);\n';
		for(var i=0;i<config.scripts.length;i++){
			if(config.scripts[i].kind == 'style')out+=`wp_enqueue_style('${config.widget_name.replace(/\s+/gm,'')}_sid_${i}', get_template_directory_uri() . "/widgets/${config.widget_name.replace(/\s+/gm,'')}/assets/${config.scripts[i].file}",array(), '1.0.0','all');\n`;
			else out+=`wp_enqueue_script('${config.widget_name.replace(/\s+/gm,'')}_sid_${i}', get_template_directory_uri() . "/widgets/${config.widget_name.replace(/\s+/gm,'')}/assets/${config.scripts[i].file}",array(), '1.0.0',false);\n`;
		}
		if(!hasTitle){
			out+= `$${titleName} = null;\nif (! empty( $instance['${titleName}'] ) ) $${titleName} = apply_filters( 'widget_title', $instance['${titleName}'] );\n`;
		}
		for(var i=0;i<config.variables.length;i++){
			if(config.variables[i].kind == 'title'){
				out+= `$${config.variables[i].name} = null;\nif (! empty( $instance['${config.variables[i].name}'] ) ) $${config.variables[i].name} = apply_filters( 'widget_title', $instance['${config.variables[i].name}'] );
				else $${config.variables[i].name} = '';
				\n`;
			}else{
				out+= `$${config.variables[i].name} = null;\nif (! empty( $instance['${config.variables[i].name}'] ) ) $${config.variables[i].name} = apply_filters( 'widget_text', $instance['${config.variables[i].name}'] );
				else $${config.variables[i].name} = '';
				\n`;
			}
		}
		out+='global $wpdb;\n';
		for(var i=0;i<config.variables.length;i++){
			var cv = config.variables[i];
			if(cv.kind == 'gallery'){
				out += `
				$image_entry_table = $wpdb->prefix . "wgp_image_entry"; 	
				if($${cv.name} != '' && $${cv.name} != null){
					$tmp_res = $wpdb->get_results("SELECT * FROM $image_entry_table WHERE gallery_id=$${cv.name}");
					$${cv.name}	= $tmp_res;
				}else {
					$${cv.name}	= array();
				}
				`;
			}
		}

		return out;
	},
	general_info: async(config)=>{
		var out = `
		parent::__construct(	
		//Base ID
		'wp_wt_${config.widget_name.replace(/\s+/gm,'')}${config.id.replace(/\s+/gm,'')}',

		//Widget name
		__('${config.widget_name}', 'wpb_widget_domain'), 

		// Widget description
		array( 'description' => __( '${config.widget_description}', 'wpb_widget_domain' ), ) 
		);
		$this->defaults = array(`;
		for(var i=0;i<config.variables.length;i++){
			out += `'${config.variables[i].name}' => '${ (config.variables[i].default !== undefined) ? config.variables[i].default : ''}',\n`;
			if(config.variables[i].kind == 'title') hasTitle = true;
		}

		if(!hasTitle){
			let ran = parseInt(Math.random()*1000);
			titleName = `wp_wt_generic_title_${ran}`;
			out+= `'${titleName}' => ''`;
		}
		out+=`);`;
		return out;
	},
	update: async(config)=>{
		var out ='';
		out +='$instance = array();';
		for(var i=0;i<config.variables.length;i++){
			if(config.variables[i].kind == 'text'){
				out+=`\nif(current_user_can( 'unfiltered_html' )){
					$instance['${config.variables[i].name}']=  $new_instance['${config.variables[i].name}'] ;
				}else {
					$instance['${config.variables[i].name}'] = wp_kses_post($new_instance['${config.variables[i].name}']);
				}`;
			}
			else out+=`\n$instance['${config.variables[i].name}']= ( ! empty( $new_instance['${config.variables[i].name}'] ) ) ? strip_tags( $new_instance['${config.variables[i].name}'] ) : '';`;
		}
		if(!hasTitle)out+=`\n$instance['${titleName}']= ( ! empty( $new_instance['${titleName}'] ) ) ? strip_tags( $new_instance['${titleName}'] ) : '';`;
		out+='\n return $instance;';
		return out;
	},
	form: async(config)=>{
		var out ='$instance = wp_parse_args( (array) $instance, $this->defaults );\n';
		var hasGallery = false;
		if(!hasTitle){
			out += `
			if ( isset( $instance[ '${titleName}' ] ) ) {
				$${titleName} = $instance[ '${titleName}' ];
			}else {
				$${titleName} = __( '', 'wpb_widget_domain' );
			}
			`;
		}
		for(var i=0;i<config.variables.length;i++){
			if(config.variables[i].kind =='boolean'){
				out += `
				if ( isset( $instance[ '${config.variables[i].name}' ] ) ) {
					$${config.variables[i].name} = $instance[ '${config.variables[i].name}' ];
				}else {
					$${config.variables[i].name} = __( 'true', 'wpb_widget_domain' );
				}
				`;
			}else if(config.variables[i].kind == 'gallery'){
				hasGallery = true;
				out += `
				if ( isset( $instance[ '${config.variables[i].name}' ] ) ) {
					$${config.variables[i].name} = $instance[ '${config.variables[i].name}' ];
				}else {
					$${config.variables[i].name} = __( 'true', 'wpb_widget_domain' );
				}
				`;
			}else{
				out += `
				if ( isset( $instance[ '${config.variables[i].name}' ] ) ) {
					$${config.variables[i].name} = $instance[ '${config.variables[i].name}' ];
				}else {
					$${config.variables[i].name} = __( '', 'wpb_widget_domain' );
				}
				`;
			}
		}
		if(hasGallery) out+=`
			global $wpdb;
		$gallery_table = $wpdb->prefix . "wgp_gallery";
		$results = $wpdb->get_results("SELECT name, id FROM $gallery_table");
		`;
		out += '?>\n';

		out+= await createForm(config.variables);

		out += '\n<?php';
		return out;
	},
	template: async (fs,config) => {
		var output = [{
			kind:'string',
			value:fs.readFileSync(`${__dirname}/../html/index.html`, "utf8")
		}];
		for(let i =0;i<config.variables.length;i++){
			let v = config.variables[i];
			let rs = {
				start:`wgt_for:start\\[${v.name}\\]`,
				middle: `(?:.|\\n)+`,
				end: `wgt_for:end\\[${v.name}\\]`
			};
			if(v.kind == 'gallery'){
				for(var j=0;j<output.length;j++){
					
					if(output[j].kind == 'string'){
						
						let t = await splitFor(rs,output[j],v);
						if(t!==false){
							
							output.splice(j,1,t);
							
							j+=t.length;
							output = _.flatten(output);	
							
						}
					}
				}
			}
			
		}
		for(let i =0;i<config.variables.length;i++){
			let v = config.variables[i];
			let rs = {
				start:`wgt_if:start\\[${v.name}=(?:'|").+(?:'|")\\]`,
				middle: `(?:.|\\n)+`,
				end: `wgt_if:end\\[${v.name}\\]`
			};
			
			if(v.kind != 'gallery'){
				for(var j=0;j<output.length;j++){
					if(output[j].kind == 'string'){
						
						let t = await splitIf(rs,output[j],v);
						if(t!==false){
							output.splice(j,1,t);
							
							j+=t.length;
							output = _.flatten(output);	
							
						}
					}
				}
			}
		}
		for(let i =0;i<config.variables.length;i++){
			let v = config.variables[i];

			
			if(v.kind != 'gallery'){
				for(var j=0;j<output.length;j++){
					
					if(output[j].kind == 'string'){
						
						let t = await handleVariables(v,output[j].value,false);
						if(t!==false){
							output.splice(j,1,t);
							
							j+=t.length;
							output = _.flatten(output);	
							
						}
					}
				}
			}
		}
		return output;
		
	}
}