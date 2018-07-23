'use strict';
var _ = require('lodash');


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
			out.push({
				kind:'php',
				value:`
				if (  empty( $item_${v.name}->${tk} ) ) echo '${v.default}';
				else echo $item_${v.name}->${tk};
				`
			})
		}else{
			out.push({
				kind:'php',
				value:`
				if (  empty( ${v.name} ) ) echo '${v.default}';
				else echo ${v.name};
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
			value:`foreach ($item_${v.name} as $${v.name}){`
			})	
		let tmaRes = await handleVariables(v,ma,true);

		for(var i=0;i<tmaRes.length;i++) out.push(tmaRes[i]);

			out.push({
				kind:'php',
				value:'}'
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

			let splitEnd = c.value.split(rend),
			matchEnd = c.value.match(rend);
			
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
		if(['color','date','datetime-local','text','email','month','number','range','number','tel','time','url','week'].indexOf(vl[i].kind) != -1){
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
		}else if(vl[i].kind == 'media'){
			out+=`
<p>
	<button class="button button-secondary media-upload-btn"  id="<?php echo $this->get_field_id( '${vl[i].name}' ); ?>"><?php _e( '${vl[i].title}' ); ?></button>
	<input id="upload-link"/>
</p>
			`;
		}else if(vl[i].kind == 'gallery'){
			out+=`
<p>
    <label for="<?php echo $this->get_field_id( '${vl[i].name}' ); ?>">  
     <?php _e( '${vl[i].title}' ); ?>
    </label>
<select>
<?php 
foreach($results as $res){
  echo '<option value="'.$res->id.'">'.$res->name.'</option>';
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
		var out ='';
		for(var i=0;i<config.scripts.length;i++){
			if(config.scripts[i].kind == 'style')out+=`wp_enqueue_style('${config.widget_name.replace(/\s+/gm,'')}_sid_${i}', get_template_directory_uri() . "/widgets/${config.widget_name.replace(/\s+/gm,'')}/assets/${config.scripts[i].file}",array(), '1.0.0','all');\n`;
			else out+=`wp_enqueue_script('${config.widget_name.replace(/\s+/gm,'')}_sid_${i}', get_template_directory_uri() . "/widgets/${config.widget_name.replace(/\s+/gm,'')}/assets/${config.scripts[i].file}",array(), '1.0.0',false);\n`;
		}
		var hasTitle = false;
		for(var i=0;i<config.variables.length;i++){
			if(config.variables[i].kind == 'title'){
				out+= `$${config.variables[i].name} = apply_filters( 'widget_title', $instance['${config.variables[i].name}'] );\n`;
			}else{
				out+= `$${config.variables[i].name} = apply_filters( 'widget_text', $instance['${config.variables[i].name}'] );\n`;
			}
		}
		return out;
	},
	general_info: async(config)=>{
		return `
parent::__construct(	
//Base ID
'wp_wt_${config.widget_name.replace(/\s+/gm,'')}${parseInt(Math.random()*10000000)}',

//Widget name
__('${config.widget_name}', 'wpb_widget_domain'), 

// Widget description
array( 'description' => __( '${config.widget_description}', 'wpb_widget_domain' ), ) 
);
		`;
	},
	update: async(config)=>{
		var out ='';
		out +='$instance = array();';
		for(var i=0;i<config.scripts.length;i++){
			out+=`\n$instance['${config.scripts[i].name}']= ( ! empty( $new_instance['${config.scripts[i].name}'] ) ) ? strip_tags( $new_instance['${config.scripts[i].name}'] ) : '';`;
		}
		out+='\n return $instance';
		return out;
	},
	form: async(config)=>{
		var out ='';
		var hasGallery = false;
		for(var i=0;i<config.variables.length;i++){
			if(config.variables.kind !='boolean'){
				out += `
				if ( isset( $instance[ '${config.variables[i].name}' ] ) ) {
					$${config.variables[i].name} = $instance[ '${config.variables[i].name}' ];
				}else {
					$${config.variables[i].name} = __( '', 'wpb_widget_domain' );
				}
				`;
			}else if(config.variables.kind == 'gallery'){
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
					$${config.variables[i].name} = __( 'true', 'wpb_widget_domain' );
				}
				`;
			}
		}
		if(hasGallery) out+=`
global $wpdb;
$gallery_table = $wpdb->prefix . "wgp_gallery";
$results = $wpdb->get_results("SELECT name, id FROM wp_wgp_gallery");
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
				// console.log(output.length);
				for(var j=0;j<output.length;j++){
					// console.log(output[j].kind);
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
				// console.log(output.length);
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