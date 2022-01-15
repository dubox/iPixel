var app = window.app || {};

app.ui = new Vue({
    el: '#ui',
    data: {
        drawer: true,
        settings:{
            imgPath:'',
            scale:2,
            actions:{
                group:4,
                rgbMerge:10,
                hsvLevel:20,
                hsvMerge:[0.08,0.0,0.08],
                sort:[
                    {
                        key:'group',
                        name:'像素大小'
                    },
                    {
                        key:'hsvLevel',
                        name:'明度阈值'
                    },
                    
                    {
                        key:'rgbMerge',
                        name:'RGB阈值'
                    },
                    
                    {
                        key:'hsvMerge',
                        name:'色相阈值'
                    },
                    
                ]
            }
        },
        runtime:{
            scale:1,
            HOnly:false,
        },
        pixel : null,
        processing:false,
        defaultColors:['#123','#abc','#765','#789','#a1b2c3'],
        pickedColor:{ r: 0, g: 0, b: 0 },
        colorPickerShow:false,
    },
    components: {
        'twitter-picker': VueColor.Twitter
      },
    computed: {
        // processing(){
        //     return this.pixel?this.pixel.processing:false;
        // }
        cvsWidth(){
            return (this.pixel && this.pixel.imgData ? this.pixel.imgData.width:0)*this.runtime.scale;
        },
        cvsHeight(){
            return (this.pixel && this.pixel.imgData ? this.pixel.imgData.height:0)*this.runtime.scale;
        },
        // colorPickerShow(){
        //     this.runtime.scale +1;
        //     return this.pixel && this.pixel.runtime.selected.level;
        // }
    },
    methods: {
       selectImg(){

            var files = utools.showOpenDialog({ 
            filters: [{ name: 'Images', extensions: ['jpg', 'png', 'jpeg'] }], 
            properties: ['openFile'] 
            });
            if(files){
                this.settings.imgPath = files[0];
            }
       },
       changeImg(){
            this.pixel.setImg(this.settings.imgPath);
            this.pixel.afterExec = ()=>{
                var colors = this.pixel.getColors();
                for(let i in colors){
                    colors[i] = `rgb(${colors[i][0]},${colors[i][1]},${colors[i][2]})`;
                }
                this.defaultColors = colors;
            };
       },
       process(){
            this.pixel.exec(this.settings);
       },
       copy(){
            utools.copyImage(this.pixel.dataUrl());
       },
       save(){
            let arr = this.settings.imgPath.split(app.path.sep);
            let file_name = arr[arr.length-1];
            file_name = file_name.split('.');
            delete file_name[file_name.length-1];
            file_name = (file_name.join('_') || 'ipixel') + '.' + Math.ceil( Math.random()*1000);
            file_name = file_name.replace(/ /g,'_');
            var file_path = utools.getPath('downloads') + app.path.sep + file_name+'.png';
            this.pixel.blob((b)=>{
                app.writeFileSync(file_path,new DataView(b));
                utools.shellShowItemInFolder(file_path);
            });
       },
       //记录下使用过的自定义颜色
       recordColor(c){  
            for(let i in this.defaultColors){
                if(this.defaultColors[i] == c)return;
            }
            this.defaultColors.push(c);
       },

       colorPanelClose(){
            this.pixel.getColorNone();//取消选择
       }
    },
    mounted() {

        //加减号缩放
        hotkeys('=,-',{ splitKey: '|' },  (e, handler)=>{
            var scale = this.runtime.scale;
            if(handler.key == '=') scale += 0.1; else scale -= 0.1;
            if(scale < 0.3 || scale > 3)  return;
            this.runtime.scale = parseFloat( scale.toFixed(1));
          });
        

          //鼠标滚轮缩放
        window.addEventListener('mousewheel',  (e) =>{
            if (!e.ctrlKey) return;
            e.preventDefault();
            var scale = this.runtime.scale;
            if (e.deltaY < 0) scale -= 0.01; else scale += 0.01;
            if(scale < 0.3 || scale > 3)  return;
            this.runtime.scale = parseFloat( scale.toFixed(2));
        },{ passive: false });


        //this.pixel = new Pixel("./img/eg.jpg" ,this.settings); //
        this.pixel = new Pixel(this.settings); //
        this.pixel.onSelect = ()=>{
            this.colorPickerShow = !!this.pixel.runtime.selected.level;
        };
    },
    watch: {
        pickedColor:function(newVal){
            //改变选中区域的颜色
            this.pixel.changeSelectedColor([newVal.rgba.r ,newVal.rgba.g ,newVal.rgba.b], this.runtime.HOnly);
            //记录使用过的颜色
            this.recordColor(`rgb(${newVal.rgba.r},${newVal.rgba.g},${newVal.rgba.b})`);
        },
        'settings.imgPath':function(){
            this.changeImg();
        },
        'runtime.scale':function(newVal){
            console.log(newVal);
            this.$Message.destroy();
            this.$Message.info((newVal * 100).toFixed(0) +'%');
        }
    }
});
