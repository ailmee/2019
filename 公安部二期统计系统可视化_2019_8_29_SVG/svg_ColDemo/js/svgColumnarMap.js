/**
 * Created by SF3298 on 2019/7/18.
 */
/**
 * [SVG_ColumnarMap 柱状图层文件]
 * @Author    LiLingLing
 * @DateTime  2019-07-18
 */
var SVG_ColumnarMap = function(svg_Initialize) {
    //-
    this.addCMConfig = function(options) {
        options = options || {};
        var config = $.extend(true, {}, colMap_dfConfig, options);
        config.isColMap = true;
        return config;
    };
    //-
    this.setCMConfig = function(opts, layerId) {
        opts = opts || {};
        layerId = parseInt(layerId);
        if (isNaN(layerId)) return;

        var layerdata = SVG_INIT._getLayerData(layerId);
        if (!layerdata.isColMap) return;

        _setConfig(layerdata, opts);
        _Collects.handleColConfig(layerdata);
    };
    //-
    this.setCMData = function(series, layerId, config) {
        series = series || [];
        layerId = parseInt(layerId);
        if (series.length===0 || isNaN(layerId)) return;

        var layerdata = SVG_INIT._getLayerData(layerId);
        if (!layerdata.isColMap) return;

        if (config) {
            _setConfig(layerdata, config);
            _Collects.handleColConfig(layerdata);
        }

        _creatColMap(series, layerdata, config);
    };
    /**
     * [disposeRender 销毁整个柱状图层接口]
     * @Author   LiLingLing
     * @DateTime 2019-07-27
     * @return   {[void]}
     */
    this.disposeRender = function() {

        _Shaders = null;
        _Materials = null;
        _Geometries = null;
        _Collects = null;

        SVG_INIT = null;
        colMap = null;
        df_pGeo = null;
        df_pMat = null;
        df_ItdMesh = df_SltMesh = null;

        df_mouseDownFunction = null;
        df_mouseHoverFunction = null;
    };
    /**
     * [setMouseDownFunction 抛出的鼠标点击事件]
     * @Author   LiLingLing
     * @DateTime 2019-07-29
     * @param func 回调方法
     */
    this.setMouseDownFunction = function(func) {
        df_mouseDownFunction = toFunction(func);
    };
    /**
     * [setMouseHoverFunction 抛出的鼠标移入/移除事件]
     * @Author   LiLingLing
     * @DateTime 2019-07-29
     * @param func 回调方法
     */
    this.setMouseHoverFunction = function(func) {
        df_mouseHoverFunction = toFunction(func);
    };
    /**
     * [_mouseMoveIn 鼠标移入事件处理]
     * @Author   LiLingLing
     * @DateTime 2019-07-29
     * @param obj 选中物体对象
     * @param event
     */
    this._mouseMoveIn = function(obj, event) {

        //- obj._index/obj._style/obj._vec/obj._block
        if(!obj._isColumnar)return;//by lilingling 添加

        //进行选中处理--obj._index
        df_ItdMesh = _heightHightObject(obj,1.0);
        //事件回调
        df_mouseHoverFunction( _getColumnarInfor(obj,event) );
    };
    /**
     * [_mouseMoveOut 鼠标移除事件处理]
     * @Author   LiLingLing
     * @DateTime 2019-07-29
     * @param obj 选中物体对象
     */
    this._mouseMoveOut = function( obj ) {
        //进行取消选中处理
        if(obj._isColumnar){
            _setSelectInfor(obj,0.0);
        }
        if(df_ItdMesh){
            //事件回调
            df_mouseHoverFunction( _getColumnarInfor(df_ItdMesh) );
            df_ItdMesh = _heightHightObject(df_ItdMesh,0.0)
        }
        //- 点击事件处理
        if(df_SltMesh){
            _setSelectInfor(df_SltMesh,1.0);
        }
    };
    /**
     * [_mouseMoveIn 鼠标按下事件处理]
     * @Author   LiLingLing
     * @DateTime 2019-07-29
     * @param obj 选中物体对象
     * @param event
     */
    this._mouseDown = function(obj, event) {
        if(obj){

            //- 还原选中状态
            df_SltMesh && (df_SltMesh = _heightHightObject(df_SltMesh,0.0));
            //-
            if(!obj._isColumnar)return;//by lilingling 添加
            //- 选中柱体
            df_SltMesh = _heightHightObject(obj,1.0);
            df_mouseDownFunction( _getColumnarInfor(obj,event));
        }else{

            df_SltMesh&&df_mouseDownFunction( _getColumnarInfor(df_SltMesh) );
            //- 还原选中状态
            df_SltMesh && (df_SltMesh = _heightHightObject(df_SltMesh,0.0));
        }
    };
    function _heightHightObject(obj,value){

        _setSelectInfor(obj,value);

        return value===0.0?null:obj;
    }
    /**
     * [_setToRise 区块上浮时，柱状图层处理事件]
     * @Author   LiLingLing
     * @DateTime 2019-07-29
     * @param isRise  [boolean型：是否上浮;true-上浮操作；false-还原操作]
     * @param name  上浮/还原的区块名称，进行精确匹配
     * @private
     */
    this._setToRise = function(isRise,name){

        SVG_INIT.SVGMapLayers&&SVG_INIT.SVGMapLayers.children.forEach(function(layer) {
            if (layer._isColMap) {//柱状图层对象

                var child = layer.children[0],
                    series = child._ser,
                    _offset = 0,isUpdate = false;
                //- 更新缓存buffer中的位置数据
                var translates = child.geometry.attributes['translate'];

                for(var i=0,len=series.length;i<len;i++){

                    if ( (series[i].data || [] ).length <= 0 || ((series[i].position || [] ).length <= 0 && (series[i].vecs || [] ).length <= 0)) continue;

                    var si = series[i],
                        offset = _offset,
                        _value = isRise?SVG_INIT._df_Tdata.py:0,//偏移值
                        l = si.data.length*si.vecs.length;

                    //- 精确匹配区块名称
                    if (_Collects.checkStr(name, si.name,true)) {

                        isUpdate = true;
                        for(var k=0;k<l;k++){
                            translates.setY(offset++,_value);
                        }
                    }
                    _offset += l;//索引值
                }

                isUpdate && (translates.needsUpdate = true);
            }
        });
    };

    //- 私有变量
    var colMap = this,
        _startTime = 0,//记录起始时间
        _tR = 0.5,//柱体半径（top）
        df_pGeo = undefined,df_pMat = undefined,//拾取平面的Geometry和Material对象，柱状图层的所有柱状拾取对象公用一套
        df_ItdMesh = null,df_SltMesh = null,//鼠标移入选中对象
        SVG_INIT = svg_Initialize, //基础对象
        df_mouseDownFunction = toFunction(),
        df_mouseHoverFunction = toFunction();
    //config  配置项
    var colMap_dfConfig = {

        visible: true, //图层显示隐藏
        //-
        isColMap: true, //是否是柱状图层配置项
        layerid: 0, //内部图层id
        name: "柱状图层", //图层名称
        series: [], //数据

        txuepath: "", //动效贴图

        //- 柱体本身的动画:动画方式(1-线性、2-渐变)-动画时长
        dynamic: {
            type: 1,//动画方式:1-线性、2-渐变
            duration: 0.5//动画时长(0-1)s
        },
        //- 光效:
        lightDynamic:{
            offsetX: 0,//X轴设置水平速度(0,1)
            offsetY: 0.5//Y轴设置垂直运动速度(0,1)
        },
        offset:new THREE.Vector2(0,0.5),

        //- 开始颜色-结束颜色
        sColors: ["#44b2ff"],
        eColors: ["#59ff99"],

        //- 纹理-开始颜色-结束颜色
        tSColors: ["#ffffff"],
        tEColors: ["#ffffff"],

        type: 1,//底面形状:1-正方形、2-五边形、3-六边形、4-八边形、5-圆形
        showPosType: 1,//显示位置:1-标点居中;2-标点居左;3-标点中心圆
        space: 3,//柱间距
        width: 20,//柱状宽度
        maxHeight: 100,//柱体最大高度

        //- 高亮颜色
        highlightColor: ["#FF0000","#0000FF"],

        xyRatio: [1, 1], // 数据缩放系数
        xyOffset: [0, 0], // 数据偏移系数

        tags:{
            color:"#ffffff",
            size:30,
            top: 0
        },

        //-
        _seg: 4,//边数
        _perimeter: 1//周长
    };

    var _Shaders = {
        //柱体着色器
        CylidVShader: [

            "attribute vec4 translate;",
            "attribute vec2 size;",
            "attribute vec4 sColor;",
            "attribute vec4 eColor;",
            //- maxHeight
            "uniform float maxHeight;",
            //- width
            "uniform float width;",
            //- perimeter-周长
            "uniform float perimeter;",
            //- ratioHeight
            "uniform float ratioHeight;",
            //- opacity
            "uniform float opacity;",
            //- highlightColor
            "uniform vec4 sHColor;",
            "uniform vec4 eHColor;",

            "#ifdef USE_TXUE",
            "uniform float u_time;",
            "uniform vec2 offset;",
            "varying vec2 vUv;",
            "#endif",

            "varying vec3 tPos;",
            "varying vec4 vSColor;",
            "varying vec4 vEColor;",

            "void main(){",

            "float isSelete = translate.w;",//translate.w=1.0,表示选中状态，颜色取高亮颜色；translate.w=0.0,表示未选中状态，颜色取本身颜色
            "vec2 scale =vec2(size.x*width,size.y*maxHeight*ratioHeight);",

            "#ifdef USE_TXUE",
            "isSelete = 0.0;",//纹理对象不被选中高亮操作
            "float maxT = scale.y/(scale.x*perimeter);",
            "vUv=vec2(uv.x+ fract( u_time * offset.x ), maxT*uv.y - fract( u_time * offset.y*maxT ) );",
            "#endif",

            "vSColor = isSelete==1.0?sHColor:vec4(sColor.rgb,sColor.a*opacity);",
            "vEColor = isSelete==1.0?eHColor:vec4(eColor.rgb,eColor.a*opacity);",
            "tPos = position;",

            "vec3 mPosition = position*vec3(scale.x,scale.y,scale.x);",
            "mPosition += translate.xyz;",
            "gl_Position = projectionMatrix * modelViewMatrix * vec4( mPosition, 1.0 );",
            "}"
        ].join("\n"),
        CylidFShader: [
            // "#define USE_TXUE",

            "#ifdef USE_TXUE",
            "uniform sampler2D u_txue;",
            "varying vec2 vUv;",
            "#endif",

            "varying vec3 tPos;",
            "varying vec4 vSColor;",
            "varying vec4 vEColor;",

            "void main() { ",

            "vec4 color = mix(vSColor,vEColor,vec4(tPos.y));",

            "#ifdef USE_TXUE",
            "vec2 uv = vec2(vUv.x>1.0?(vUv.x-1.0):vUv.x,vUv.y<0.0?(1.0+vUv.y):vUv.y);",
            "color *= texture2D( u_txue, uv );",
            "#endif",

            "gl_FragColor = color;",
            "}"
        ].join("\n")
    };
    //- Common methods
    var _Collects = {
        obj: function() {
            return new THREE.Object3D();
        },
        color: function(c) {
            return new THREE.Color(c);
        },
        // 数值大小范围限制
        clamp: function(v, mi, ma, df) {
            return Math.min(ma, Math.max(mi, isNaN(v) ? df : v));
        },
        // 数值取值限制
        limit: function(v, arr) {
            return (arr.indexOf(v) != -1) ? v : arr[0];
        },
        /**
         * [checkStr 匹配模式]
         * @Author   ZHOUPU
         * @DateTime 2019-06-03
         * @param    {[string]}   string1 [匹配字符串1]
         * @param    {[string]}   string2 [匹配字符串2]
         * @param    {[string]}   type    [1-精确 2-模糊]
         */
        checkStr: function(string1, string2, type) {
            type = type || SVG_INIT.dataMatchType;
            if (type === 1) {
                return (string1 === string2); //精确匹配
            } else {
                return (string1.indexOf(string2) === 0 || string2.indexOf(string1) === 0); //模糊匹配
            }
        },
        /**
         * [getStyle 获取RGBA颜色]
         * @Author   ZHOUPU
         * @DateTime 2018-08-10
         * @param    {[array]}   cArr [颜色数组——[ THREE颜色, 透明度 ] ]
         * @return   {[string]}        [rgba颜色]
         */
        getStyle: function(cArr) {
            return 'rgba(' + ((cArr[0].r * 255) | 0) + ',' + ((cArr[0].g * 255) | 0) + ',' + ((cArr[0].b * 255) | 0) + ',' + cArr[1] + ')';
        },
        /**
         * [getColorArr 分拆RGBA,获取颜色（THREE）和透明度数组]
         * @Author   ZHOUPU
         * @DateTime 2018-08-02
         * @param    {[string/number]}   str [rgba/rgb/16进制/颜色名称等]
         * @return   {[array]}       [颜色（THREE）和透明度数组]
         */
        getColorArr: function(str) {
            if (isArray(str)) return str;
            var _arr = [];
            str = str + '';
            str = str.toLowerCase().replace(/\s/g, "");
            if (/^((?:rgba)?)\(\s*([^\)]*)/.test(str)) {
                var arr = str.replace(/rgba\(|\)/gi, '').split(',');
                var hex = [
                    pad2(Math.round(arr[0] * 1 || 0).toString(16)),
                    pad2(Math.round(arr[1] * 1 || 0).toString(16)),
                    pad2(Math.round(arr[2] * 1 || 0).toString(16))
                ];
                _arr[0] = _Collects.color('#' + hex.join(""));
                _arr[1] = Math.max(0, Math.min(1, (arr[3] * 1 || 0)));
            } else if ('transparent' === str) {
                _arr[0] = _Collects.color();
                _arr[1] = 0;
            } else {
                _arr[0] = _Collects.color(str);
                _arr[1] = 1;
            }

            function pad2(c) {
                return c.length == 1 ? '0' + c : '' + c;
            }
            return _arr;
        },

        /**
         * [handleColConfig 初始化配置项]
         * @Author   LiLingLing
         * @DateTime 2019-07-18
         * @param    {[object]}   layerdata [配置项参数对象]
         * @return   {[void]}
         */
        handleColConfig: function(layerdata){
            //-
            layerdata.visible = layerdata.visible != undefined ? !!layerdata.visible: true;
            layerdata.name = layerdata.name+'';

            layerdata.xyRatio = layerdata.xyRatio != undefined ? layerdata.xyRatio : [1, 1];
            layerdata.xyOffset = layerdata.xyOffset != undefined ? layerdata.xyOffset : [0, 0];

            layerdata.sColors.forEach(function(value,i){
                layerdata.sColors[i] = _Collects.getColorArr(value);
            });
            layerdata.eColors.forEach(function(value,i){
                layerdata.eColors[i] = _Collects.getColorArr(value);
            });

            //- 纹理-起始颜色/结束颜色
            layerdata.tSColors.forEach(function(value,i){
                layerdata.tSColors[i] = _Collects.getColorArr(value);
            });
            layerdata.tEColors.forEach(function(value,i){
                layerdata.tEColors[i] = _Collects.getColorArr(value);
            });

            layerdata.txuepath = layerdata.txuepath;
            //先处理纹理对象
            layerdata._txue&&layerdata._txue.dispose();
            layerdata._txue = _createImgTexture(layerdata.txuepath);

            //- 柱体本身的动画:动画方式(1-线性、2-渐变)-动画时长
            layerdata.dynamic.duration = _Collects.clamp(layerdata.dynamic.duration - 0, 0, 100, 0.5);
            layerdata.dynamic.type = parseInt(layerdata.dynamic.type) || 1;
            //- 光效:
            layerdata.lightDynamic.offsetX = _Collects.clamp(layerdata.lightDynamic.offsetX - 0, -1, 1, 0);
            layerdata.lightDynamic.offsetY = _Collects.clamp(layerdata.lightDynamic.offsetY - 0, -1, 1, 0.5);
            layerdata.offset = new THREE.Vector2(layerdata.lightDynamic.offsetX,layerdata.lightDynamic.offsetY);

            //-
            layerdata.type = parseInt(layerdata.type)|| 1;
            layerdata.showPosType = parseInt(layerdata.showPosType) || 1;
            layerdata.space = _Collects.clamp(layerdata.space - 0, 0, 999, 3);
            layerdata.width = _Collects.clamp(layerdata.width - 0, 0, 999, 20);
            layerdata.maxHeight = _Collects.clamp(layerdata.maxHeight - 0, 0, 999, 100);

            //- 高亮颜色
            layerdata.highlightColor.forEach(function(value,i){
                layerdata.highlightColor[i] = _Collects.getColorArr(value);
            });

        },
        //-
        createTextTexture: function(text){

            var canvas = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
            var context = canvas.getContext('2d');
            context.font = '40px Times New Roman"';
            var maxLength = context.measureText(text).width;

            var leave = 256 || 1;
            leave = (leave == 3) ? 4 : leave;
            var width = Math.min(256 * leave, Math.max(64, THREE.Math.nextPowerOfTwo(maxLength + 4)));
            canvas.width = canvas.height = width;

            context.shadowColor = "black";
            context.shadowBlur = 3;

            //-
            context.font = '40px Times New Roman';
            context.textAlign = "center";
            context.textBaseline = "middle";
            //-
            context.fillStyle = "white";
            context.fillText( text, width / 2, width / 2 );

            var texture = new THREE.Texture( canvas );
            // texture.minFilter = texture.magFilter = THREE.LinearFilter;
            texture.needsUpdate = true;

            canvas = null;

            return texture;
        }
    };
    /**
     * [_Materials 常用材质对象]
     * @type {Object}
     */
    var _Materials = {

        basic: function(param) {
            return new THREE.MeshBasicMaterial(param);
        },
        shader: function(param) {
            return new THREE.ShaderMaterial(param);
        }
    };
    /**
     * [_Geometries 常用几何体对象]
     * @type {Object}
     */
    var _Geometries = {
        geo: function() {
            return new THREE.Geometry();
        },
        buf: function() {
            return new THREE.BufferGeometry();
        },
        plane: function(w, h, ws, hs) {
            return new THREE.PlaneGeometry(w, h, ws, hs);
        },
        insBuf: function() {
            return new THREE.InstancedBufferGeometry();
        }
    };
    /**
     * [_setConfig 设置配置项参数]
     * @Author   LiLingLing
     * @DateTime 2019-07-18
     * @param    {[object]}   layerdata [old配置项]
     * @param    {[object]}   opts      [new配置项]
     */
    function _setConfig(layerdata, opts) {

        layerdata.visible = opts.visible != undefined ? opts.visible : layerdata.visible;
        layerdata.name = opts.name != undefined ? opts.name : layerdata.name;
        layerdata.sColors = isArray(opts.sColors) ? opts.sColors : layerdata.sColors;
        layerdata.eColors = isArray(opts.eColors) ? opts.eColors : layerdata.eColors;
        //- 纹理-起始颜色/结束颜色
        layerdata.tSColors = isArray(opts.tSColors) ? opts.tSColors : layerdata.tSColors;
        layerdata.tEColors = isArray(opts.tEColors) ? opts.tEColors : layerdata.tEColors;

        layerdata.txuepath = opts.txuepath != undefined ? opts.txuepath : layerdata.txuepath;

        layerdata.xyRatio = opts.xyRatio != undefined ? [opts.xyRatio[0]-0||0,opts.xyRatio[1]-0||0] : layerdata.xyRatio;
        layerdata.xyOffset = opts.xyOffset != undefined ? [opts.xyOffset[0]-0||0,opts.xyOffset[1]-0||0] : layerdata.xyOffset;

        //- 动画
        if( opts.dynamic ) {
            layerdata.dynamic.duration = opts.dynamic.duration != undefined ? opts.dynamic.duration : layerdata.dynamic.duration;
            layerdata.dynamic.type = opts.dynamic.type != undefined ? opts.dynamic.type : layerdata.dynamic.type;
        }
        //- 光效动画
        if( opts.lightDynamic ) {
            layerdata.lightDynamic.offsetX = opts.lightDynamic.offsetX != undefined ? opts.lightDynamic.offsetX : layerdata.lightDynamic.offsetX;
            layerdata.lightDynamic.offsetY = opts.lightDynamic.offsetY != undefined ? opts.lightDynamic.offsetY : layerdata.lightDynamic.offsetY;
        }

        //-
        layerdata.type = opts.type != undefined ? opts.type : layerdata.type;
        layerdata.showPosType = opts.showPosType != undefined ? opts.showPosType : layerdata.showPosType;
        layerdata.space = opts.space != undefined ? opts.space : layerdata.space;
        layerdata.width = opts.width != undefined ? opts.width : layerdata.width;
        layerdata.maxHeight = opts.maxHeight != undefined ? opts.maxHeight : layerdata.maxHeight;

        //- 高亮颜色-不能超过三个颜色
        (isArray(opts.highlightColor)&&opts.highlightColor.length<3)&&opts.highlightColor.forEach(function(value,i){
            layerdata.highlightColor[i] = value;
        });
        //-
        layerdata.tags = opts.tags != undefined ? opts.tags : layerdata.tags;
    }
   //-
    function _creatColMap(series, layerdata) {
        //- 移除拾取对象
        for (var i = SVG_INIT.mEventArr.length - 1; i >= 0; i--) {
            var child = SVG_INIT.mEventArr[i];
            if (child._isColumnar && child.parent.LayerID == layerdata.layerid) {
                SVG_INIT.mEventArr.splice(i, 1);
            }
        }
        //- 删除原对象 -- 有问题
        SVG_INIT.SVGMapLayers&&SVG_INIT.SVGMapLayers.children.forEach(function(layer) {
            if (layer._isColMap && layer.LayerID === layerdata.layerid) {

                _disposeObj(layer);
                SVG_INIT.SVGMapLayers.remove(layer);
                layer = null;
            }
        });

        _startTime = 0;
        df_ItdMesh = null;
        df_SltMesh = null;

        //- 获取形状
        _getSegments(layerdata);
        //- series
        layerdata.series = series;

        //- 区块处理
        for(var i=0, len=series.length; i<len; i++){

            var _si = series[i] || {};
            if ( (_si.data || [] ).length <= 0) continue;

            //- 位置数据
            if ( (_si.position || [] ).length <= 0){//没有经纬度

                if(!_si.name) continue;//未定义名称处理

                for(var j=0 ,jl = SVG_INIT.shapesArr.length;j<jl;j++){
                    var node = SVG_INIT.shapesArr[j];
                    if (_Collects.checkStr(node._name, _si.name)) {

                        var offset = SVG_INIT.SVGMapObj[node._path_id].offset;
                        var center = node._center;
                        var x = (center.x - SVG_INIT.svgOffset.x) / SVG_INIT.WHRatio.x + offset[0];
                        var y= (center.z - SVG_INIT.svgOffset.z) / SVG_INIT.WHRatio.z + offset[1];

                        //-
                        var _ratioX = SVG_INIT.svgOffset.x / SVG_INIT.WHRatio.x,
                            _ratioZ = SVG_INIT.svgOffset.z / SVG_INIT.WHRatio.z,
                            //-
                            x = (x + _ratioX) * SVG_INIT.xyRatio[0] + SVG_INIT.xyOffset[0] - _ratioX;
                        y = (y + _ratioZ) * SVG_INIT.xyRatio[1] + SVG_INIT.xyOffset[1] - _ratioZ;
                        //-
                        x = (x + _ratioX) * layerdata.xyRatio[0] + layerdata.xyOffset[0] - _ratioX;
                        y = (y + _ratioZ) * layerdata.xyRatio[1] + layerdata.xyOffset[1] - _ratioZ;

                        _si.vecs = [{ vector: [x,y], value: ''}];//数据
                        break;
                    }
                }
            }else{//经纬度处理

                _si.vecs = [];
                _si.position.forEach(function(value){
                    _si.vecs.push({ vector:  _transVec( value.vector || [], layerdata.xyRatio, layerdata.xyOffset ), value: ''});
                });
            }
        }

        //- 添加对象
        var layerObject = _Collects.obj();
        //- 创建柱体对象
        var _obj = _cylMesh(layerObject,layerdata);
        if ( !_obj ) return;

        layerObject._isColMap = true;
        layerObject._perSpeed = layerdata.dynamic.duration===0?0:1.0/layerdata.dynamic.duration;//动画时长处理
        layerObject.name = layerdata.name;

        layerObject.position.y = SVG_INIT._df_Tdata.py+.1;
        layerObject.visible = layerObject._visible = layerdata.visible;

        layerObject._positionY = layerObject.position.y;
        layerObject.LayerID = layerdata.layerid;

        SVG_INIT.SVGMapLayers.add(layerObject);

        SVG_INIT.onRender( SVG_INIT.renderID.svg_columnarmap, _animation );
    }
    //-
    function _cylMesh(layerObject,layerdata){

        var _isTex = layerdata._txue!==null?true:false;//编辑态为true:挂载纹理对象；运行态根据layerdata._txue来确定
        //- Material/geo
        var cylMat = _creatMaterial(layerdata),//获取材质-{mat:,tMat:}
            cyGeo = _creatCylGeo(layerdata._seg,_isTex);//获取geo--{geo:,tGeo:}
        //- plane:拾取对象的geo、Material
        var _pGeo = _creatPGeo(),
            _pMat = _creatPMaterial();
        //- object:不带纹理的柱状对象
        var object = new THREE.Mesh(cyGeo.geo,cylMat.mat);
        layerObject.add(object);
        //- index:1
        var textObj = _Collects.obj();
        textObj._isText = true;
        layerObject.add(textObj);

        //- 生成buffer数据
        var series = layerdata.series,
            _i = 0,_offset = 0;
        var translates = [], sizes = [], sColors = [], eColors = [];
        var tSColors = [], tEColors = [];//纹理颜色
        for(var k=0,l = series.length;k<l;k++){

            var _si = series[k] || {};
            //没有类目数据||没有区域和顶点数时，则丢弃
            if ( (_si.data || [] ).length <= 0 || ((_si.position || [] ).length <= 0 && (_si.vecs || [] ).length <= 0)) continue;

            var _data = _si.data;
            for(var i=0,len=_data.length;i<len;i++){

                //_data[i]:{value: '类目1', name:"类目1", weight: [.6,.2], color:['#D11920','#1E18D1']}
                var infor = _data[i];
                var _weight = infor.weight,
                    _sCl = layerdata.sColors[i] || layerdata.sColors[0],//没有匹配的颜色，默认第一个颜色组
                    _eCl = layerdata.eColors[i] || layerdata.eColors[0],
                    //- 纹理起始颜色/结束颜色
                    _sSCl = layerdata.tSColors[i] || layerdata.tSColors[0],
                    _sECl = layerdata.tEColors[i] || layerdata.tEColors[0];

                //- 判断是否自带颜色处理
                if(infor.color){

                    infor.color[0]&&(_sCl = _Collects.getColorArr(infor.color[0]));
                    infor.color[1]&&(_eCl = _Collects.getColorArr(infor.color[1]));
                }

                //- buffer数据
                for(var j=0,jl=_weight.length; j<jl; j++){

                    var _w = _Collects.clamp(_weight[j] - 0, 0, 1, 1);

                    sizes.push(1,_w);
                    sColors.push(_sCl[0].r,_sCl[0].g,_sCl[0].b,_sCl[1]);
                    eColors.push(_eCl[0].r,_eCl[0].g,_eCl[0].b,_eCl[1]);
                    //- 纹理颜色
                    tSColors.push(_sSCl[0].r,_sSCl[0].g,_sSCl[0].b,_sSCl[1]);
                    tEColors.push(_sECl[0].r,_sECl[0].g,_sECl[0].b,_sECl[1]);

                    //- 生成拾取对象
                    var _plane = new THREE.Mesh(_pGeo,_pMat);
                    _plane.scale.set(layerdata.width,layerdata.maxHeight*_w,layerdata.width);

                    //- 设置拾取对象的相关信息
                    _plane.LayerID = layerdata.layerid;
                    _plane._index = _i++;//记录第几个物体
                    _plane._style = i;//记录类目
                    _plane._vec = j;//记录位置
                    _plane._block = k;//记录
                    _plane._isColumnar = true;

                    //- 添加拾取对象
                    object.add(_plane);
                    SVG_INIT.mEventArr.push( _plane );

                    //- 标签
                    var _text = _textMesh(infor.value,layerdata.tags);
                    _text.scale.set(layerdata.tags.size,layerdata.tags.size,1);
                    textObj.add(_text);
                }
            }

            //- 获取位置偏移数据
            _offset = _getTranslates(object,translates,_offset,layerdata,_si);
        }

        //- translate:前三个数为位置数，最后一个数为是否选中标志值（1--表示选中；0--表示未选中）
        var _translate = new THREE.InstancedBufferAttribute( new Float32Array( translates ), 4 ),
            _size = new THREE.InstancedBufferAttribute( new Float32Array( sizes ), 2 ),
            _sColor = new THREE.InstancedBufferAttribute(new Float32Array( sColors ), 4 ),
            _eColor = new THREE.InstancedBufferAttribute(new Float32Array( eColors ), 4 ),
            _tSColor = new THREE.InstancedBufferAttribute(new Float32Array( tSColors ), 4 ),
            _tEColor = new THREE.InstancedBufferAttribute(new Float32Array( tEColors ), 4 );

        //- 不带纹理的柱状对象写入geo数据
        cyGeo.geo.addAttribute( 'translate', _translate );
        cyGeo.geo.addAttribute( 'size', _size );
        cyGeo.geo.addAttribute( 'sColor', _sColor );
        cyGeo.geo.addAttribute( 'eColor', _eColor );

        //- 带纹理的柱状对象写入geo数据并生成带纹理的柱状对象
        if(_isTex){

            cyGeo.tGeo.addAttribute( 'translate', _translate );
            cyGeo.tGeo.addAttribute( 'size', _size );
            cyGeo.tGeo.addAttribute( 'sColor', _tSColor );//tSColors
            cyGeo.tGeo.addAttribute( 'eColor', _tEColor );

            var _tObj = new THREE.Mesh(cyGeo.tGeo,cylMat.tMat);
            _tObj._isLightEff = true;
            _tObj.name = series.name+'_光效';
            _tObj.frustumCulled = false;

            object.add(_tObj);
        }

        object._ser = series;
        object.frustumCulled = false;

        return object;
    }
    //-
    function _textMesh(text,config){

        var _txue = _Collects.createTextTexture(text);
        var _tag = new THREE.Sprite( new THREE.SpriteMaterial( {
            map: _txue,
            // transparent:true,
            //opacity: 1,
            color: config.color,
            depthWrite: false
        } ) );

        return _tag;
    }
    /**
     * [_getTranslates 获取柱状体的位置平移值数据]
     * @Author   LiLingLing
     * @DateTime 2019-07-29
     * @param obj 柱状体对象（不带纹理的）
     * @param translates 平移数据数组
     * @param offset 平移数据数组的索引值
     * @param layerdata 配置项参数
     * @param series 区块的数据信息
     * @returns {*} 平移数据数组被修改了的索引值
     * @private
     */
    function _getTranslates(obj,translates,offset,layerdata,series){

        var _data = series.data,
            pos = series.vecs,
            len=_data.length;

        var _tags = obj.parent.children[1];

        //计算平移值
        var vertexs = _setTranslates(layerdata,len);
        for(var i=0;i<len;i++){
            //_data[i]:{value: ['类目1'], name:"类目1", weight: [.6,.2], color:['#D11920','#1E18D1']}
            var _weight =  _data[i].weight;
            for(var j=0,l=_weight.length; j<l; j++){
                //-
                var _vec = pos[j].vector;
                translates[offset*4] = _vec[0]+vertexs[i*2],translates[offset*4+1] = 0,translates[offset*4+2] = _vec[1]+vertexs[i*2+1];
                translates[offset*4+3] = translates[offset*4+3] || 0;//存放是否选中标志位：1--表示选中；0--表示未选中
                //- 拾取对象plane更新
                obj.children[offset].position.set(translates[offset*4],translates[offset*4+1],translates[offset*4+2]);
                //- 标签
                _tags.children[offset].position.set(
                    translates[offset*4],
                    translates[offset*4+1]+layerdata.maxHeight*_weight[j]+layerdata.tags.top,
                    translates[offset*4+2]
                );

                offset++;
            }
        }

        return offset;
    }
    /**
     * [_setTranslates 设置位置数据：根据显示位置来计算位置数据]
     * @Author   LiLingLing
     * @DateTime 2019-07-29
     * @param layerdata 配置项参数
     * @param len 一组柱状物体的个数
     * @returns {Array} 位置数据
     * @private
     */
    function _setTranslates(layerdata,len){

        //计算平移值
        var vertexs = [],
            _offsetX = 0,
            _space = layerdata.space + layerdata.width,
            _width = layerdata.width;

        //显示位置:1-标点居中;2-标点居左;3-标点中心圆
        switch(layerdata.showPosType){

            case 1://标点居中;
                _offsetX = -(len-1)*_space*0.5;
                for ( var x = 0; x < len; x ++ ) {

                    vertexs.push(x*_space + _offsetX,0);
                }
                break;
            case 2://标点居左
                _offsetX = _width*0.5;
                for ( var x = 0; x < len; x ++ ) {

                    vertexs.push(x*_space + _offsetX,0);
                }
                break;
            case 3://标点中心圆
                if(len>1){
                    for ( var x = 0; x < len; x ++ ) {

                        var u = x / len;
                        var theta = u * 6.283185307179586 + 0;//Math.PI/4
                        var sinTheta = Math.sin( theta );
                        var cosTheta = Math.cos( theta );
                        // vertex
                        vertexs.push(_space * sinTheta);
                        vertexs.push(_space * cosTheta);
                    }
                }else{

                    vertexs.push(0,0);
                }
                break;
        }

        return vertexs;
    }
    /**
     * [_setTranslates 生成柱状对象的Geometry]
     * @Author   LiLingLing
     * @DateTime 2019-07-29
     * @param _seg 分段数
     * @param open 是否封顶
     * @returns {{geo: undefined, tGeo: undefined}} 不带纹理的Geometry，带纹理的Geometry
     * @private
     */
    function _creatCylGeo(_seg,open) {

        // buffers
        var indices = [];
        var vertices = [];
        var normals = [];
        var uvs = [];

        var radialSegments = Math.floor( _seg ) || 8;
        var heightSegments = 1;

        var openEnded = !!open;
        var thetaStart = Math.PI/4;
        var thetaLength = Math.PI * 2;

        var radiusTop = _tR;
        var radiusBottom = _tR;
        var height = 1;

        // helper variables
        var index = 0;
        var indexArray = [];

        var x, y;
        var normal = new THREE.Vector3();
        var vertex = new THREE.Vector3();

        // this will be used to calculate the normal
        var slope = ( radiusBottom - radiusTop ) / height;

        // generate vertices, normals and uvs
        for ( y = 0; y <= heightSegments; y ++ ) {

            var indexRow = [];
            var v = y / heightSegments;
            // calculate the radius of the current row
            var radius = v * ( radiusTop - radiusBottom ) + radiusBottom;

            for ( x = 0; x <= radialSegments; x ++ ) {

                var u = x / radialSegments;

                var theta = u * thetaLength + thetaStart;

                var sinTheta = Math.sin( theta );
                var cosTheta = Math.cos( theta );

                // vertex
                vertex.x = radius * sinTheta;
                vertex.y = v * height;//- v * height + halfHeight;
                vertex.z = radius * cosTheta;
                vertices.push( vertex.x, vertex.y, vertex.z );

                // normal
                normal.set( sinTheta, slope, cosTheta ).normalize();
                normals.push( normal.x, normal.y, normal.z );

                // uv --需要修改
                // uvs.push( u, 1 - v );
                uvs.push( u, v );

                // save index of vertex in respective row
                indexRow.push( index ++ );
            }

            // now save vertices of the row in our index array
            indexArray.push( indexRow );
        }
        // generate indices
        for ( x = 0; x < radialSegments; x ++ ) {

            for ( y = 0; y < heightSegments; y ++ ) {

                // we use the index array to access the correct indices
                var a = indexArray[ y ][ x ];
                var b = indexArray[ y ][ x + 1 ];
                var c = indexArray[ y + 1 ][ x + 1 ];
                var d = indexArray[ y + 1 ][ x ];

                // faces
                indices.push( a, b, d );
                indices.push( b, c, d );
            }
        }

        var _geo = undefined,_tGeo = undefined;
        if(openEnded){//带纹理对象

            _tGeo = _Geometries.insBuf();
            _tGeo.setIndex(indices.slice(0));
            _tGeo.addAttribute( 'position', new THREE.Float32BufferAttribute( vertices.slice(0), 3 ) );
            _tGeo.addAttribute( 'normal', new THREE.Float32BufferAttribute( normals.slice(0), 3 ) );
            _tGeo.addAttribute( 'uv', new THREE.Float32BufferAttribute( uvs.slice(0), 2 ) );
        }

        generateCap();
        //- InstancedBufferGeometry
        _geo = _Geometries.insBuf();
        _geo.setIndex(indices);
        _geo.addAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
        _geo.addAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ) );
        _geo.addAttribute( 'uv', new THREE.Float32BufferAttribute( uvs, 2 ) );

        function generateCap() {

            var x, centerIndexStart, centerIndexEnd;

            var vertex = new THREE.Vector3();

            var radius = radiusTop;
            var sign = 1;

            // save the index of the first center vertex
            centerIndexStart = index;

            // vertex
            vertices.push( 0, height * sign, 0 );
            // normal
            normals.push( 0, sign, 0 );
            // uv
            uvs.push( -1.0, 0.0 );
            // increase index
            index ++;

            // save the index of the last center vertex
            centerIndexEnd = index;

            // now we generate the surrounding vertices, normals and uvs
            for ( x = 0; x <= radialSegments; x ++ ) {

                var u = x / radialSegments;
                var theta = u * thetaLength + thetaStart;

                var cosTheta = Math.cos( theta );
                var sinTheta = Math.sin( theta );

                // vertex
                vertex.x = radius * sinTheta;
                vertex.y = height * sign;
                vertex.z = radius * cosTheta;
                vertices.push( vertex.x, vertex.y, vertex.z );

                // normal
                normals.push( 0, sign, 0 );

                // uv
                // uv.x = ( cosTheta * 0.5 ) + 0.5;
                // uv.y = ( sinTheta * 0.5 * sign ) + 0.5;
                // uvs.push( uv.x, uv.y );
                uvs.push( -1.0, 0.0 );

                // increase index
                index ++;
            }
            // generate indices
            for ( x = 0; x < radialSegments; x ++ ) {

                var i = centerIndexEnd + x;
                // face top
                indices.push( i, i + 1, centerIndexStart );
            }
        }

        return {
            geo: _geo,
            tGeo: _tGeo
        };
    }
    /**
     * [_creatPGeo 生成拾取对象的Geometry]
     * @Author   LiLingLing
     * @DateTime 2019-07-29
     * @returns {Object} Geometry对象
     * @private
     */
    function _creatPGeo(){
        if(df_pGeo) return df_pGeo;

        //- 生成拾取平面
        var pos = [-_tR,0,0, _tR,0,0, 0,0,_tR, 0,0,-_tR];
        var vertices = [], indices = [0,1,2,2,3,1, 4,5,6,6,7,5];
        for(var i=0;i<4;i++){

            vertices.push(pos[i*3],pos[i*3+1],pos[i*3+2]);
            vertices.push(pos[i*3],pos[i*3+1]+1,pos[i*3+2]);
        }

        df_pGeo = _Geometries.buf();
        df_pGeo.setIndex(indices);
        df_pGeo.addAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );

        df_pGeo.rotateY(Math.PI/4);

        return df_pGeo;
    }
    /**
     * [_creatMaterial 生成柱状对象的材质对象]
     * @Author   LiLingLing
     * @DateTime 2019-07-29
     * @param layerdata 配置项参数
     * @returns {{mat: *, tMat: null}} 无纹理材质，有纹理材质
     * @private
     */
    function _creatMaterial(layerdata){

        //- uniforms
        var hColor = layerdata.highlightColor;
        var uniforms = {
            sHColor: {value: new THREE.Vector4(hColor[0][0].r,hColor[0][0].g,hColor[0][0].b,hColor[0][1])},
            eHColor: {value: new THREE.Vector4(hColor[1][0].r,hColor[1][0].g,hColor[1][0].b,hColor[1][1])},
            maxHeight: {value: layerdata.maxHeight},
            width: {value: layerdata.width},
            perimeter: {value: layerdata._perimeter*0.5},
            ratioHeight: {value: layerdata.dynamic.type===1?0.0:1.0},//1-线性
            opacity: {value: layerdata.dynamic.type===2?0.0:1.0}//2-渐变
        };
        Object.assign(uniforms,{

            u_time: {value: 1.0},
            offset: { value: layerdata.offset },
            u_txue: {value: layerdata._txue}
        });

        var _shader = {
            uniforms: uniforms,
            // wireframe: true,
            transparent: true,
            blending: THREE.NormalBlending
        };

        return {
            mat: _Materials.shader(  Object.assign({
                vertexShader: _Shaders.CylidVShader,
                fragmentShader: _Shaders.CylidFShader},_shader)),
            tMat: _Materials.shader( Object.assign({
                vertexShader: "#define USE_TXUE\n"+_Shaders.CylidVShader,
                fragmentShader: "#define USE_TXUE\n"+_Shaders.CylidFShader},_shader))
        };
    }
    /**
     * [_creatPMaterial 生成拾取对象的材质对象]
     * @Author   LiLingLing
     * @DateTime 2019-07-29
     * @returns {Object} 材质对象
     * @private
     */
    function _creatPMaterial(){
        if(df_pMat) return df_pMat;
        //LineVShader
        df_pMat = _Materials.basic({
            side: THREE.DoubleSide,
            visible: false
        });

        return df_pMat;
    }
    /**
     * [_getLayerInfor 根据图层id更新相应属性值和模型属性值--只能修改一个参数]
     * @Author   LiLingLing
     * @DateTime 2019-07-29
     * @param layerId 图层id值
     * @param opt [{name:属性名,value:属性值}]--说明：着色器中属性名最好与图层的参数名保持一致
     * @param setCallback 图层的参数值的修改回调--用于修改多个参数
     * @param callback 着色器中属性值的修改回调--用于修改多个属性或名称不一致的情况
     * @private
     */
    function _getLayerInfor(layerId,opt,setCallback,callback){

        layerId = parseInt(layerId);
        if (isNaN(layerId)) return;

        //- 设置参数
        var layerdata = SVG_INIT._getLayerData(layerId);
        if (!layerdata.isColMap) return;
        setCallback&&setCallback(layerdata);
        layerdata[opt.name] = opt.value !== undefined?opt.value: layerdata[opt.name];

        //设置参数生效
        var layer,children = SVG_INIT.SVGMapLayers.children;
        for(var i=0,len=children.length;i<len;i++){

            var child = children[i];
            if (child._isColMap && child.LayerID === layerId) {
                layer = child;
                break;
            }
        }
        layer&&layer.children.forEach(function(child){
            child.material.uniforms[opt.name] && (child.material.uniforms[opt.name].value = layerdata[opt.name]);
            callback&&callback(child,layerdata);
        });
    }
    /**
     * [_getPolygonPerimeter 计算多边形的周长]
     * @Author   LiLingLing
     * @DateTime 2019-07-25
     * @param n 边数
     * @param r 半径
     * @returns {number} 周长值
     * @private
     */
    function _getPolygonPerimeter(n,r){

        return 2*r*n*Math.sin(Math.PI/n);
    }
    /**
     * [_getSegments 获取多边形边数值以及计算其周长]
     * @Author   LiLingLing
     * @DateTime 2019-07-25
     * @param infor 图层数据-layerdata：配置项参数
     * @private
     */
    function _getSegments(infor){

        switch(infor.type){
            case 1://正方形
                infor._seg = 4;
                break;
            case 2://五边形
                infor._seg = 5;
                break;
            case 3://六边形
                infor._seg = 6;
                break;
            case 4://八边形
                infor._seg = 8;
                break;
            case 5://圆形
                infor._seg = 30;
                break;
        }

        infor._perimeter = _getPolygonPerimeter(infor._seg,_tR);
    }
    /**
     * [_setSelectInfor 设置选中/未选中效果]
     * @Author   LiLingLing
     * @DateTime 2019-07-29
     * @param obj 选中的拾取对象
     * @param value 选中：1.0；未选中：0.0
     * @private
     */
    function _setSelectInfor(obj,value){

        //进行选中处理
        var _translates = obj.parent.geometry.attributes['translate'];
        _translates.setW(obj._index,value);
        _translates.needsUpdate = true;
    }
    /**
     * [_getColumnarInfor 获取单个柱状的信息]
     * @Author   LiLingLing
     * @DateTime 2019-07-29
     * @param obj 选中的拾取对象
     */
    function _getColumnarInfor(obj,event){

        return event?{
                type:true,
                layerId: obj.LayerID,
                series: obj.parent._ser[obj._block],//获取区块信息
                index0: obj._style,//类别索引值
                index1: obj._vec,//类别中的索引值/position索引值
                event: event
            }:{
                type:false,
                layerId: obj?obj.LayerID:null
            };
    }
    /**
     * [_createImgTexture 生成纹理对象]
     * @Author   LiLingLing
     * @DateTime 2019-07-29
     * @param value 图片路径名
     * @returns {null || Object} 纹理对象
     * @private
     */
    function _createImgTexture(value) {

        if (typeof (value) == "undefined" || value == "") {
            return null;
        }

        return SVG_INIT._TxueLoader.load(value, function(tex) {
            tex.minFilter = THREE.LinearFilter;
            // tex.minFilter = THREE.NearestFilter;
            // tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        });
    }
    /**
     * [_selfAnimation 动画：柱体自身动画]
     * @Author   LiLingLing
     * @DateTime 2019-07-26
     * @param obj 材质uniforms中的参数对象
     * @param _elapsedTime  时间
     * @param perSpeed  平均速度
     * @returns {boolean}
     * @private
     */
    function _selfAnimation(obj,_elapsedTime,perSpeed){

        if(obj.value<1.0){

            obj.value = _elapsedTime*perSpeed;
            (perSpeed===0 || obj.value>=1.0)&&(obj.value=1.0);
            return true;
        }

        return false;
    }
    /**
     * [_animation 动画：光效]
     * @Author   LiLingLing
     * @DateTime 2019-07-25
     * @param dt 时间间隙值
     * @param clock 时钟对象
     * @private
     */
    function _animation( dt, clock ) {
        if ( dt > 0.1 ) return;

        !_startTime && (_startTime = clock.elapsedTime);//记录开始时间
        var _elapsedTime = clock.elapsedTime-_startTime;//计算时间

        SVG_INIT.SVGMapLayers.children.forEach( function( layer ) {

            layer._isColMap && layer.visible && ( layer.children.forEach( function( node ) {

                if(!node._isText){

                    var uniforms = node.material.uniforms;
                    //动画-先播放完柱体自身动画，再播放光效动画
                    if(!_selfAnimation(uniforms.ratioHeight,_elapsedTime,layer._perSpeed) && !_selfAnimation(uniforms.opacity,_elapsedTime,layer._perSpeed)){
                        //光效
                        uniforms.u_time && (uniforms.u_time.value = _elapsedTime);
                    }
                }

            } ) );
        } );
    }
    /**
     * [_transVec 经度纬度转换成3D坐标]
     * @Author   LiLingLing
     * @DateTime 2019-07-25
     * @param _vec [数组[x,y]]
     * @returns {[x,y]}
     * @private
     */
    function _transVec( _vec, xyRatio, xyOffset ) {
        var vx = _Collects.clamp(_vec[0]*1, -Infinity, Infinity, 0),
            vz = _Collects.clamp(_vec[1]*1, -Infinity, Infinity, 0),
            _ratioX = SVG_INIT.svgOffset.x / SVG_INIT.WHRatio.x,
            _ratioZ = SVG_INIT.svgOffset.z / SVG_INIT.WHRatio.z,
            vector = SVG_INIT.CoordTrans.transCoord( vx, vz );
        //-
        vector[0] = (vector[0] + _ratioX) * SVG_INIT.xyRatio[0] + SVG_INIT.xyOffset[0] - _ratioX;
        vector[1] = (vector[1] + _ratioZ) * SVG_INIT.xyRatio[1] + SVG_INIT.xyOffset[1] - _ratioZ;

        return [
            (vector[0] + _ratioX) * xyRatio[0] + xyOffset[0] - _ratioX,
            (vector[1] + _ratioZ) * xyRatio[1] + xyOffset[1] - _ratioZ
        ];
    }
    /**
     * [_disposeObj 销毁对象，解绑与GPU的联系，删除子对象，释放内存]
     * @Author   ZHOUPU
     * @DateTime 2018-08-02
     * @param    {[object]}   obj [待销毁的object3D对象]
     * @return   {[void]}
     */
    function _disposeObj(obj) {
        if (obj instanceof THREE.Object3D) {

            objectTraverse(obj, function(child) {

                if (child.geometry) {
                    if (child.geometry._bufferGeometry) {
                        child.geometry._bufferGeometry.dispose();
                    }
                    child.geometry.dispose();
                    child.geometry = null;
                }

                if (child.material instanceof THREE.MultiMaterial) {
                    child.material.materials.forEach(function(mtl) {
                        disposeMaterial(mtl);
                    });
                } else if (child.material) {
                    disposeMaterial(child.material);
                }

                if (child.parent) child.parent.remove(child);
                child = null;

            });
        }
    }
    /**
     * [disposeMaterial 销毁材质]
     * @Author   ZHOUPU
     * @DateTime 2018-08-02
     * @param    {[object]}   obj      [THREE的材质对象]
     * @return   {[void]}
     */
    function disposeMaterial(mtl) {
        if (mtl.uniforms && mtl.uniforms.u_txue && mtl.uniforms.u_txue.value) {
            if (mtl.__webglShader) {
                mtl.__webglShader.uniforms.u_txue.value.dispose();
                mtl.__webglShader.uniforms.u_txue.value = null;
            } else {
                mtl.uniforms.u_txue.value.dispose();
                mtl.uniforms.u_txue.value = null;
            }
        }
        if (mtl.map) {
            mtl.map.dispose();
            mtl.map = null;
            if (mtl.__webglShader) {
                mtl.__webglShader.uniforms.map.value.dispose();
                mtl.__webglShader.uniforms.map.value = null;
            }
        }
        mtl.dispose();
        mtl = null;
    }
    /**
     * [objectTraverse 遍历对象树，由叶到根]
     * @Author   ZHOUPU
     * @DateTime 2018-08-02
     * @param    {[object]}   obj      [THREE的object3D对象]
     * @param    {Function} callback [回调函数，返回遍历对象]
     * @return   {[void]}
     */
    function objectTraverse(obj, callback) {
        if (!isFunction(callback)) return;
        var children = obj.children;
        for (var i = children.length - 1; i >= 0; i--) {
            objectTraverse(children[i], callback);
        }
        callback(obj);
    }
    /**
     * [isArray 判断是否是一个array]
     * @Author   ZHOUPU
     * @DateTime 2018-08-02
     * @param    {[type]}   o [待判断的参数]
     * @return   {Boolean}    [true-array、false-not array]
     */
    function isArray(o) {
        return Object.prototype.toString.call(o) == '[object Array]';
    }
    /**
     * [isFunction 判断是否是一个function]
     * @Author   ZHOUPU
     * @DateTime 2018-08-02
     * @param    {[type]}   a [待判断的参数]
     * @return   {Boolean}    [false-not function、true-function]
     */
    function isFunction(a) {
        return Object.prototype.toString.call(a) === '[object Function]';
    }
    /**
     * [toFunction 参数不是function转为function，是则返回本身]
     * @Author   ZHOUPU
     * @DateTime 2018-08-02
     * @param    {[type]}   a [待判断的参数]
     * @return   {[function]}     [function]
     */
    function toFunction(a) {
        var b = Object.prototype.toString.call(a) === '[object Function]';
        return b ? a : function(o) {};
    }
};