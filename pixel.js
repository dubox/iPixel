

function Pixel(img_path,options){
    if(typeof img_path == 'string')
        this.imgPath = img_path;
    this.options = options;
    if(typeof img_path == 'object'){
        this.options = img_path;
        this.imgPath = this.options.imgPath || '';
    }

    this.img = new Image();
    this.cvs = document.getElementById('canvas');
    this.mask = document.getElementById('mask');
    this.ctx = this.cvs.getContext('2d');
    this.imgData = null;
    this.groupSize = 1; //当前像素块的边长
    

    Object.assign(this,Pixel.actions);

    this.processing = false;
    this.load();
    this.mask.addEventListener('click',(ev)=>{
        //let g=this.XY2GxGy(ev.layerX,ev.layerY);
        let g=this.XY2GxGy(ev.offsetX,ev.offsetY);  //transform: scale(2.3);
        var selected = this.runtime.selected;
        if(selected.p[0] == g.x &&  selected.p[1] == g.y){
            selected.level++;
        }else{
            selected.level=1;
            selected.p = [g.x,g.y];
        }
        if(selected.level > 3)selected.level=0;

        let acts = ['None','One','Area','All']; 
        this['getColor'+acts[selected.level]](g.x,g.y);
        this.onSelect();
    });

    if(this.imgPath){
        this.exec();
    }
}

Pixel.prototype.setImg = function(img_path){
    this.img.src = this.imgPath = img_path;
}

Pixel.prototype.load = function(){

    var img = this.img;
    if(this.imgPath)
        img.src = this.imgPath;
    img.onload = ()=>{
        this.exec();//console.log(this.imgData.data,this.imgOriginData)
    };
    
}

Pixel.prototype.exec = function(options){
    this.options = options = options || this.options;
    this.processing = true;
    var cvs = this.cvs;
    var ctx = this.ctx;
    var img = this.img;
    cvs.width=img.width/options.scale;
    cvs.height=img.height/options.scale;
    
    setTimeout(()=>{
        ctx.clearRect(0,0, cvs.width,cvs.height);
        ctx.drawImage(img,0,0,img.width, img.height,0,0, cvs.width,cvs.height);
        this.imgData = ctx.getImageData(0,0, cvs.width,cvs.height);
            //this.imgOriginData = this.imgData.data;
            console.log((new Date()).getTime());
            this.groupSize = options.actions['group'];
            var row_size = Math.ceil( this.imgData.width/this.groupSize);
            var col_size = Math.ceil( this.imgData.height/this.groupSize);
            var act = [];
            for(let i in options.actions.sort){
                let item = options.actions.sort[i];
                
                     //act .push( this[item.key](options.actions[item.key]) );
                     var act = this[item.key](options.actions[item.key]) ;
                     for(let i=0; i< row_size*col_size;i++){
                    
                        // act.forEach((v)=>{
                        //     v(this.getGroup(i) ,i);
                        // });
    
                        act(this.getGroup(i) ,i);
                    }
            }
                
            
        
        console.log((new Date()).getTime());
    
        this.draw();
        this.processing = false;

        setTimeout(()=>{
            this.initMask();
            this.afterExec();console.log((new Date()).getTime());
        });
    });
    
}


Pixel.prototype.draw = function(){
    this.ctx.putImageData(this.imgData,0,0);
};


Pixel.prototype.afterExec = function(){
    
};


Pixel.prototype.onSelect = function(){
    
};


Pixel.prototype.initMask = function(){
    var mask = this.mask;
    var cvs = this.cvs;
    mask.width = cvs.width;
    mask.height = cvs.height;
    mask.ctx = mask.getContext('2d');
    //console.log(mask.ctx.getImageData(0,0, mask.width,mask.height))
}

Pixel.prototype.dataUrl = function(){
    return this.cvs.toDataURL();
};


Pixel.prototype.dataUrl = function(){
    return this.cvs.toDataURL();
};


Pixel.prototype.blob = function(fn){
    this.cvs.toBlob(function(b){
        b.arrayBuffer().then((buf)=>{
            fn(buf);
        });
        
    });
};



Pixel.actions = {

    group(d){
        this.groupSize = d;
        return (g ,index)=>{
            //var g = this.getGroup(i);
            var avg = [0,0,0];
            g.forEach((v)=>{
                let p = this.getPixel(v);//g[Math.ceil(g.length/2)]
                avg[0]+=p[0];
                avg[1]+=p[1];
                avg[2]+=p[2];
            });
            avg = avg.map((v)=>{return Math.floor(v/g.length)});
            this.setGroup(index,avg);
        }
    },

    rgbMerge(threshold){

        var temp = [];
        return (g,index)=>
        {
            var arr1 = this.getPixel(g[0]);
            
            if(!temp.length)temp.push(arr1);
            for(let j=0;j<temp.length;j++){
                var r = arr1[0]-temp[j][0];
                var g = arr1[1]-temp[j][1];
                var b = arr1[2]-temp[j][2];
                if(
                    Math.sqrt(r*r+g*g+b*b)<threshold
                ){
                    this.setGroup(index ,temp[j]);
                    return;
                }
                
            }
            temp.push(arr1);
        }
        
    },

    hsvLevel(level){
        //var level = 10;
        return (g ,index)=>
        {
            var arr = this.getPixel(g[0]);
            var arr1 = this.RGBtoHSV(arr);
            
            //arr1[0] = Math.floor( arr1[0]*360/level)*(level/360)+(level/360/2);
            //arr1[1] = Math.floor( arr1[1]*100/level)*(level/100)+(level/100/2);
            arr1[2] = Math.floor( arr1[2]*100/level)*(level/100)+(level/100/2);
            
            this.setGroup(index ,this.HSVtoRGB(arr1));
            
        }
    },

    hsvMerge(threshold ){
        var temp = [];
        
        return (g ,index)=>{
            var arr1 = this.getPixel(g[0]);
            var arr2 = this.RGBtoHSV(arr1);
            
            //if(!temp.length)temp.push(arr1);
            for(let j=0;j<temp.length;j++){
                var temp2 = this.RGBtoHSV(temp[j]);
                var h_diff = Math.abs(arr2[0]-temp2[0]);
                if(
                    (h_diff<= threshold[0] || (1-h_diff)<= threshold[0])
                    // && Math.abs(arr1[1]-temp[j][1]) <= threshold[1]
                    && Math.abs(arr2[2]-temp2[2]) < 0.05//threshold[2]
                ){
                    this.setGroup(index ,temp[j]);
                    return;
                }
            }
            temp.push(arr1);
        }
    }
};

/**
 * 获取像素块
 * @param {*} i 第几个像素块
 * @param {*} d 像素块边长
 * @returns 
 */
Pixel.prototype.getGroup_bak = function (i ){
    var imgData = this.imgData;
    var d = this.groupSize;
    var g = [];
    for(let r=0;r<d;r++){//行
        var g_row = Math.floor(i/(imgData.width/d));
        var p_row = g_row*d + r;

        for(let c=0;c<d;c++){//列
            let g_col = i%(imgData.width/d);
            let p_col = g_col*d+c;
            g.push(p_row*imgData.width + p_col);
        }
    }
    return g;
}
Pixel.prototype.getGroup = function (i ){
    let row_size = Math.ceil( this.imgData.width/this.groupSize);
    let gx = i % row_size;
    let gy = (i-gx) / row_size;
    return this.getGroupByGxGy(gx ,gy);
}

/**
 * 设置色块颜色，支持index和坐标
 * @param {*} x 
 * @param {*} y 
 * @param {*} arr 
 */
Pixel.prototype.setGroup = function (x,y ,arr){
    if(!arr){
        arr = y;
        var group = this.getGroup(x);
    }else{
        var group = this.getGroupByGxGy(x,y);
    }
    group.forEach((v)=>{this.setPixel(v,arr);});
}



Pixel.prototype.getColors = function(){
    var row_size = Math.ceil( this.imgData.width/this.groupSize);
    var col_size = Math.ceil( this.imgData.height/this.groupSize);
    var goal = [];
    
    loop1:for(let i=0; i< row_size*col_size;i++){
        var g = this.getGroup(i);
        var p = this.getPixel(g[0]);
        for(let ii in goal){
            if(goal[ii][0] == p[0]
                && goal[ii][1] == p[1]
                && goal[ii][2] == p[2])continue loop1;
        }
        goal.push(p);
    }
    
    return goal;
}



Pixel.prototype.getColorAll = function(gx,gy){
    var row_size = Math.ceil( this.imgData.width/this.groupSize);
    var col_size = Math.ceil( this.imgData.height/this.groupSize);
    var goal = [];
    var target = this.getGroupByGxGy(gx,gy)[0];//目标颜色像素；
    target_pixel = this.getPixel(target);
    
    for(let i=0; i< row_size*col_size;i++){
        var g = this.getGroup(i);
        if(this.pixelEQ(target ,g[0])){
            goal.push(i);
        }
    }

    this.showMask(goal);
}


Pixel.prototype.getColorArea = function(gx,gy){
    var row_size = Math.ceil( this.imgData.width/this.groupSize);
    var col_size = Math.ceil( this.imgData.height/this.groupSize);
    var goal = [],tmp = [];
    var target = this.getGroupByGxGy(gx,gy)[0];//目标颜色像素；
    //target_pixel = this.getPixel(target);
    var exist = (p)=>{
        for(i in tmp){
            if(tmp[i][0]==p[0] && tmp[i][1]==p[1])
            return true;
        }
        return false;
    };
    tmp.push([gx,gy]);
    for(let i=0; i< tmp.length;i++){
        var v = tmp[i];//console.log(v)
        var g = this.getGroupByGxGy(v[0],v[1]);
        if(this.pixelEQ(target ,g[0])){
            goal.push(v);//加入结果集
            //寻找相邻像素:上下左右
            //上
            if(v[1] - 1 >= 0)
            if(!exist([v[0],v[1]-1])){
                tmp.push([v[0],v[1]-1]);
            }
            //下
            if(v[1] + 1 < col_size)
            if(!exist([v[0],v[1]+1])){
                tmp.push([v[0],v[1]+1]);
            }
            //左
            if(v[0] - 1 >= 0)
            if(!exist([v[0]-1,v[1]])){
                tmp.push([v[0]-1,v[1]]);
            }
            //右
            if(v[0] + 1 < row_size)
            if(!exist([v[0]+1,v[1]])){
                tmp.push([v[0]+1,v[1]]);
            }

        }
    }
    
    //this.ctx.putImageData(this.imgData,0,0);
    this.showMask(goal);
    //console.log(goal);
}


Pixel.prototype.getColorOne = function(gx,gy){
    
    this.showMask([[gx,gy]]);
}


Pixel.prototype.getColorNone = function(){
    this.runtime.selected.p = [-1,-1];
    this.showMask([]);
}


/**
 * TODO:
 * 显示缩放比例
 * 选中单个色块
 * 取消选中
 * 色板，选取改变颜色
 */

 Pixel.prototype.runtime = {
    selected:{
        p:[-1,-1],
        // set p(val){
        //     this._p = val;
        //     var target = this.getGroupByGxGy(gx,gy)[0];//目标颜色像素；
        //     target_pixel = this.getPixel(target);
        // },
        //color:[],
        level:0,
        data:[],
    }
 };

/**
 * 改变选中区域的颜色
 * @param {Array} rgb 数组
 * @param {Boolean} HOnly 是否只改变色相，默认：false
 */
 Pixel.prototype.changeSelectedColor = function(rgb ,HOnly = false){
    
    var color = rgb;
    if(HOnly){
        color = this.RGBtoHSV(rgb);
        color = [color[0],-1,-1];
        let p = this.runtime.selected.p;
        var target = this.getGroupByGxGy(p[0],p[1])[0];//目标颜色像素；
        color = this.mergeByHSV(target ,color);
    }
    this.runtime.selected.data.forEach((v)=>{
        if(typeof v == 'number')
            var g = this.getGroup(v);
        else
            var g = this.getGroupByGxGy(v[0],v[1]);
        
        g.forEach((vv)=>{ 
            this.setPixel(vv ,color );
        });
    });
    this.draw();
 }




Pixel.prototype.showMask = function(groupArr){
    this.runtime.selected.data = groupArr;
    var imgData = new ImageData(this.mask.width, this.mask.height);
    groupArr.forEach((v)=>{
        if(typeof v == 'number')
            var g = this.getGroup(v);
        else
            var g = this.getGroupByGxGy(v[0],v[1]);
        g.forEach((vv)=>{ 
            imgData.data[vv*4+3] = 50;//
        });
    });
    this.mask.ctx.putImageData(imgData,0,0);
}

Pixel.prototype.pixelEQ = function(a,b){
    a = this.getPixel(a);
    b = this.getPixel(b);
    if(a[0] == b[0]
        && a[1] == b[1]
        && a[2] == b[2])
        return true;
    return false;
}

//通过色块坐标获取色块
Pixel.prototype.getGroupByGxGy = function(gx,gy){
    var d = this.groupSize;
    var g = [];
    var first_row = gy*d;//该group的第一行像素的y值
    var first_col = gx*d;//该group的第一列像素的x值
    for(let r=0;r<d;r++){//像素 行
        p_row = first_row+r;
        for(let c=0;c<d;c++){//列
            let p_col = first_col + c;
            g.push(p_row*this.imgData.width + p_col);
        }
    }
    return g;
    //return this.getGroup( (imgData.width/this.groupSize)*gy + gx );
}

//通像素坐标获取色块
Pixel.prototype.getGroupByXY = function(x,y){
    //var imgData = this.imgData;
    let G = this.XY2GxGy(x,y);
    return this.getGroupByGxGy( G.x ,G.y );
}

Pixel.prototype.XY2GxGy = function(x,y){
    return {x:Math.floor(x/this.groupSize),y:Math.floor(y/this.groupSize)};
}

Pixel.prototype.getPixelByXY = function(x,y){
    return this.getPixel( this.imgData.width * (y) + x);
}

Pixel.prototype.getPixel = function(i){
    var imgData = this.imgData;
    let p = i*4;
    return [
        imgData.data[p],
        imgData.data[p+1],
        imgData.data[p+2],
        imgData.data[p+3],
    ];
}

Pixel.prototype.setPixel = function(i ,color ,type = 'rgb'){
    var rgb = color;
    if(type == 'hsv'){
        rgb = this.mergeByHSV(i ,color);
    }

    let p = i*4;
    this.imgData.data[p] = rgb[0];
    this.imgData.data[p+1] = rgb[1];
    this.imgData.data[p+2] = rgb[2];
    if(rgb[3])
    this.imgData.data[p+3] = rgb[3];
}

/**
 * 使用指定hsv值（大于0的部分） 覆盖 指定像素的hsv 
 * @param {number} i 
 * @param {Array} hsv 
 * @returns {Array} rgb
 */
Pixel.prototype.mergeByHSV = function(i ,hsv){
    var origin_hsv = this.RGBtoHSV(this.getPixel(i));
    for(let ii in hsv){
        if(hsv[ii] < 0)
            hsv[ii] = origin_hsv[ii];
    }
    return this.HSVtoRGB(hsv);
}


Pixel.prototype.RGBtoHSV = function(rgb) {

    var r=rgb[0],g=rgb[1],b=rgb[2];

    var max = Math.max(r, g, b), min = Math.min(r, g, b),
        d = max - min,
        h,
        s = (max === 0 ? 0 : d / max),
        v = max / 255;

    switch (max) {
        case min: h = 0; break;
        case r: h = (g - b) + d * (g < b ? 6: 0); h /= 6 * d; break;
        case g: h = (b - r) + d * 2; h /= 6 * d; break;
        case b: h = (r - g) + d * 4; h /= 6 * d; break;
    }
    //return [h*360,s*100,v*100];
    return [h,s,v];

}

Pixel.prototype.HSVtoRGB = function(hsv) {
    var h=hsv[0],s=hsv[1],v=hsv[2];
    var r, g, b, i, f, p, q, t;
    
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);

    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }

    return [Math.round(r * 255),Math.round(g * 255),Math.round(b * 255)];
}

