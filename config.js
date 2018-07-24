module.exports = {
	widget_name:'test', //only a-z, A-Z, 0-9 und _
	widget_description:'',
	version:'0.0.1',
	id:'00001',
	scripts:[{
		kind:'style',
		name:'style',
		file:'style.css'
	},{
		kind:'script',
		name:'code',
		file:'test.js'
	}],
	variables:[{
		name:'test1',
		kind:'text',
		title:'Title',
		default:'this is a test1'
	},{
		name:'test2',
		kind:'gallery',
		title:'Title',
		default:'this is a test2'
	},{
		name:'test3',
		kind:'text',
		title:'Title',
		default:'this is a test3'
	},{
		name:'test4',
		kind:'gallery',
		title:'Title',
		default:'this is a test4'
	}],
} 