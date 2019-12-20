;(function( global, $, document, undefined ) { "use strict";

    /**
     * [SVG_Initialize SVG地图类]
     * @Author   ZHOUPU
     * @DateTime 2018-07-28
     */
    var svgInitialize_LLL = function() {
        //-
        this.scene;
        this.camera;
        this.renderer;
        this.controls;
        //- 容器
        this.GId = '';
        this.container;
        this.parentCont;
        this.Result = false;
        this.is_Init = false;

        //- SVG底图缩放、偏移系数
        this.WHRatio; //缩放系数 { x:1, y:1, z:1 }
        this.svgOffset; //偏移系数 { x:0, y:0, z:0 }

        //- 经纬度转换
        this.WTCoords = []; //三个经纬度坐标
        this.XYCoords = []; //对应的三个二维坐标
        this.CoordTrans; //转换函数

        //- 数据缩放 偏移系数
        this.xyRatio = [1, 1]; // 数据缩放系数
        this.xyOffset = [0, 0]; // 数据偏移系数

        //- 变量  map对象、外边框、区块数组、区块数组长度
        this.mapObject;
        this.outBorderObj;
        this.shapesArr = [];
        this.shapesArrLen = 0;

        //- SVGData数据, SVGData对象
        this.SVGMapData;
        this.SVGMapObj = {};

        //- 图片loader
        this._TxueLoader;

        //- 事件数组
        this.mEventArr = [];

        //- 选中属性  未选中-null, 选中-object { type: true-触发,false-不触发, params: opts }
        this.selectOptins = null;
        this.dataMatchType = 2; //地图数据匹配方式  1-精确匹配   2-模糊匹配  默认2（模糊匹配）

        //- 图层
        this.SVGMapLayers;
        this.LayersLength = 0; // 图层个数
        this.LayersArray = []; // 图层数据
        this.LayersOrder = []; // 图层顺序对象
        this.LayerTagLength = 1; //图层标签长度
        this.renderID = { // onRender ID
            svg_pointmap: 'svg_pointmap',
            svg_heatmap: 'svg_heatmap',
            svg_migratemap: 'svg_migratemap',
            svg_extension: 'svg_extension',
            svg_columnarmap: 'svg_columnarmap'//lilingling on time 2019/7/19 添加：柱状图层
        };

        //- 标注图层
        this.pointMap;
        //- 热力图层
        this.heatMap;
        //- 迁移图层
        this.migrateMap;
        //- lilingling on time 2019/7/19 添加：柱状图层
        this.columnarMap;

        /**
         * [init 初始化接口]
         * @Author   ZHOUPU
         * @DateTime 2018-07-28
         * @param    {[string/object]}   cts    [容器id或者容器dom对象]
         * @param    {[object]}   config [配置参数]
         * @return   {[void/error]}          [初始化错误返回错误提示]
         */
        this.init = function(cts, config) {
            var conts = parseCts(cts);
            if (detector() && conts != null) {
                try {
                    var config = config || {};
                    df_Config = $.extend(true, {}, default_Config, config);
                    df_Config.__isWorked = false;

                    thm.parentCont = conts;
                    thm.GId += THREE.Math.generateUUID();
                    var TId = conts.attr('id') + '_' + thm.GId;
                    thm.container = creatContainer(TId);
                    thm.parentCont.html(thm.container);
                    _Collects.loadTexture();

                    initiate();
                    thm.is_Init = true;

                    //- 经纬度转换
                    thm.CoordTrans = new CoordTrans(thm);

                    //- 柱状 by lilingling on time 2019/7/19
                    thm.columnarMap = new SVG_ColumnarMap(thm);
                } catch (e) {
                    thm.Result = 'error! Initialization Error!';
                    // thm.Result = $i18n('svgMap_model_html_27');
                    df_ErrorCallback(thm.Result);
                    return;
                }
            } else {
                thm.Result = 'error! Not Support WebGL!';
                // thm.Result = $i18n('svgMap_model_html_28');
                df_ErrorCallback(thm.Result);
            }
        };

        //渲染接口
        this.render = function() {
            if (thm.is_Init) {
                renderers();
            }
        };

        //渲染回调函数接口
        this.onRender = function(id, func) {
            if (undefined !== thm.renderID[id]) {
                df_OnRenderCallback[id] = toFunction(func);
            }
        };
        //渲染或者解析错误回调接口
        this.onError = function(func) {
            df_ErrorCallback = toFunction(func);
        };

        /**
         * [disposeRender 销毁整个SVG地图场景接口]
         * @Author   ZHOUPU
         * @DateTime 2018-07-28
         * @return   {[void]}
         */
        this.disposeRender = function() {
            if (thm.is_Init && testing()) {
                thm.is_Init = false;
            }
        };

        //-----svg底图 管理------ ------------------------------------------
        //***********************************************************************************//
        /**
         * [onContResize 容器重置大小接口]
         * @Author   ZHOUPU
         * @DateTime 2018-07-28
         * @param    {[number]}   w    [容器宽度值]
         * @param    {[number]}   h    [容器高度值]
         * @param    {[number]}   time [改变宽高延时时间]
         * @return   {[void]}
         */
        this.onContResize = function(w, h, time) {
            if (thm.is_Init) {
                time = _Collects.clamp(time * 1, 0, 1000, 200);
                var df_OnDelay = setTimeout(function() {
                    thm && thm.parentCont && onContResize(w, h);
                    clearTimeout(df_OnDelay);
                }, time);
            }
        };

        /**
         * [setCoordTrans 经纬度坐标转换初始化接口]
         * @Author   ZHOUPU
         * @DateTime 2018-07-28
         * @param    {[array]}   xyOpts [平面坐标数组]
         * @param    {[array]}   jwOpts [经纬度坐标数组]
         */
        this.setCoordTrans = function(xyOpts, jwOpts) {
            if (thm.is_Init) {
                jwOpts = thm.WTCoords = jwOpts || [];
                xyOpts = thm.XYCoords = xyOpts || [];
                thm.CoordTrans.init(jwOpts, xyOpts);
            }
        };

        //设置标签位置缩放参数xRatio,yRatio均为Number
        this.setScaleRatio = function(value) {
            thm.xyRatio = value;
        };

        //设置标签位置平移参数xOffset,yOffset均为Number
        this.setOffset = function(value) {
            thm.xyOffset = value;
        };

        //- 获取相机参数
        this.getCameraParams = function() {
            if (thm.is_Init) {
                return {
                    fov: thm.camera.fov,
                    position: [thm.camera.position.x, thm.camera.position.z, thm.camera.position.y]
                }
            }
        };

        //- 设置相机参数
        this.setCameraParams = function(param) {
            if (thm.is_Init) {
                thm.camera.fov = param.fov;
                thm.camera.position.set(param.position[0], param.position[2], param.position[1]);
                thm.camera.rotation.set(param.rotation[0], param.rotation[1], param.rotation[2]);//
                thm.camera.updateProjectionMatrix();
            }
        };

        //- 动画开关
        this._animation = true;
        this._setAnimation = function(val) {
            if (thm.is_Init) {
                thm._animation = (val === true);
                !thm._animation && setControlsOff(thm.controls);
                thm._animation && setControls(thm.controls, df_Config.controls);
            }
        };

        /**
         * [setSVGMap 设置SVG底图接口]
         * @Author   ZHOUPU
         * @DateTime 2018-07-28
         * @param    {[object]}   data [SVG数据对象]
         * @param    {[object]}   opt  [入场动画参数对象]
         */
        this.setSVGMap = function(data, opt) {
            if (thm.is_Init) {
                try {

                    df_ItdMesh = null, df_SltMesh = null;
                    init3DMesh(data);
                } catch (e) {
                    thm.Result = 'error! SVG Data Error!';
                    df_ErrorCallback(thm.Result);
                    return;
                }
                opt && thm.setAdmissionDynamic(opt);
            }
        };

        //-----svg 图层 管理------ ------------------------------------------
        //***********************************************************************************//
        /**
         * [addLayersLabels 添加图层]
         * @Author   ZHOUPU
         * @DateTime 2018-08-10
         * @param    {[string]}   type    [图层类别]
         * @param    {[object]}   options [图层配置项]
         */
        this.addLayersLabels = function(type, options) {
            if (thm.is_Init && thm.SVGMapLayers) {
                if (thm.LayersLength >= 10) return;
                thm.LayersArray.push(thm.__getlayerOpts(thm.LayersLength, type, options));
                thm.LayersLength++;
            }
        };
        /**
         * [changeLayersLabels 改变图层]
         * @Author   ZHOUPU
         * @DateTime 2018-08-11
         * @param    {[number]}   layerId [被更改的图层序号-数组下标]
         * @param    {[string]}   type    [更改图层的类型]
         * @param    {[object]}   options [更改图层的配置项]
         * @return   {[void]}
         */
        this.changeLayersLabels = function(layerId, type, options) {
            var index = parseInt(layerId);
            for (var i = 0, _l = thm.LayersArray.length; i < _l; i++) {
                if (thm.LayersArray[i].layerid == index) {
                    thm.LayersArray[i] = null;
                    thm.LayersArray[i] = thm.__getlayerOpts(index, type, options);
                    break;
                }
            }
            deleteLayerMap(index, true);
        };
        /**
         * [__getlayerOpts 根据类别获取图层配置项参数]
         * @Author   ZHOUPU
         * @DateTime 2018-08-11
         * @param    {[number]}   layerId [图层序号-数组下标]
         * @param    {[string]}   type    [图层类别]
         * @param    {[object]}   options [图层配置项参数]
         * @return   {[object]}           [图层配置项参数]
         */
        this.__getlayerOpts = function(layerId, type, options) {
            var layerOpts;
            switch (type) {
                case 'pointMap':
                    layerOpts = thm.pointMap.addPointLabels(options);
                    break;
                case 'heatMap':
                    layerOpts = thm.heatMap.addHMConfig(options);
                    break;
                case 'migrateMap':
                    layerOpts = thm.migrateMap.addMigLineLayer(options);
                    break;
                case 'columnarMap'://-柱状图层 by lilingling on time 2019/7/19
                    layerOpts = thm.columnarMap.addCMConfig(options);
                    break;
            }
            layerOpts.layerid = layerId;
            return layerOpts;
        };

        //设置图层顺序,layerArr为图层顺序数组
        this.setLayerSort = function(layerArr) {
            layerArr = layerArr || [];
            thm.LayersOrder = $.extend(true, [], layerArr);
            for (var i = 0, _l = thm.LayersOrder.length; i < _l; i++) {
                if (thm.LayersOrder[i] > df_DeleteIndex) thm.LayersOrder[i]--;
            }
        };
        /**
         * [showLayer 显示图层]
         * @Author   DUKAI
         * @DateTime 2018-07-05T09:42:14+0800
         * @param                    layerId [图层序号-数组下标]
         */
        this.showLayer = function(layerId) {
            var index = parseInt(layerId);
            var layerData = thm._getLayerData(index);
            layerData.visible = true;
            var layer;
            thm.SVGMapLayers.children.forEach(function(child) {
                if (child.LayerID == index) layer = child;
            });
            if (layer) {
                layer.visible = layer._visible = true;
                layer.traverse(function(child) {
                    if (child._isMigMapBackLabels || child._isBackLabels || child._isMLine) child.visible = child._visible = true;
                })
            }
        };
        /**
         * [hideLayer 隐藏图层]
         * @Author   DUKAI
         * @DateTime 2018-07-05T09:43:02+0800
         * @param                    layerId [图层序号-数组下标]
         */
        this.hideLayer = function(layerId) {
            var index = parseInt(layerId);
            var layerData = thm._getLayerData(index);
            layerData.visible = false;
            var layer;
            thm.SVGMapLayers.children.forEach(function(child) {
                if (child.LayerID == index) layer = child;
            });
            if (layer) {
                layer.visible = layer._visible = false;
                layer.traverse(function(child) {
                    if (child._isMigMapBackLabels || child._isBackLabels || child._isMLine) child.visible = child._visible = false;
                })
            }
        };
        /**
         * [deleteLayer 删除图层]
         * @Author   DUKAI
         * @DateTime 2018-07-05T09:44:13+0800
         * @param                    layerId [图层序号-数组下标]
         */
        this.deleteLayer = function(layerId) {
            var index = parseInt(layerId);
            df_DeleteIndex = index;
            for (var i = 0, _l = thm.LayersArray.length; i < _l; i++) {
                if (thm.LayersArray[i].layerid == index) {
                    thm.LayersArray.splice(i, 1);
                    break;
                }
            }
            for (var i = 0, _l = thm.LayersArray.length; i < _l; i++) {
                if (thm.LayersArray[i].layerid > index) thm.LayersArray[i].layerid--;
            }
            deleteLayerMap(index, false);
            thm.LayersLength--;
        };
        /**
         * [setLayerName 设置图层名称]
         * @Author   DUKAI
         * @DateTime 2018-07-05T09:59:16+0800
         * @param                   name    [名称]
         * @param                   layerId [图层序号-数组下标]
         */
        this.setLayerName = function(name, layerId) {
            var index = parseInt(layerId);
            var layerData = thm._getLayerData(index);
            layerData.name = name;
        };
        /**
         * [_getLayerData 根据图层序号获取图层数据]
         * @Author   DUKAI
         * @DateTime 2018-07-12T14:04:25+0800
         * @param    {[number]}                 layerid [图层序号-数组下标]
         * @return   {[object]}
         */
        this._getLayerData = function(layerid) {
            var layer = {};
            thm.LayersArray.forEach(function(child) {
                if (child.layerid == parseInt(layerid)) layer = child;
            });
            return layer;
        };

        /*
         * @Author TangChengchuan
         * @Date 2019/5/25
         * @Description _getLayeridByIds 根据id查询layerid
         * @param {id} id =>number 图层id
         * @return {layerid} layerid=>number layerid
         */
        this._getLayeridByIds = function(id) {
            var layer = 0;
            thm.LayersArray.forEach(function(child) {
                if (child.id == parseInt(id)) layer = child.layerid;
            });
            return layer;
        };
        //-----svg底图配置项设置管理------ ------------------------------------------
        //***********************************************************************************//
        /**
         * [setAdmissionDynamic 设置入场动画]
         * @Author   ZHOUPU
         * @DateTime 2018-07-28
         * @param    {[object]}   opt [入场动画参数对象]
         */
        this.setAdmissionDynamic = function(opt) {
            if (thm.is_Init) {
                opt = opt || {};
                df_AdmisDic = $.extend(true, {}, default_AdmissionDynamic, opt);
                df_AdmisDic.type = _Collects.limit(df_AdmisDic.type * 1, [0, 1, 2]);
                df_AdmisDic.perTime = _Collects.clamp(df_AdmisDic.perTime * 1, 0.1, 5, 2);
                df_AdmisDic._transTimes = (df_AdmisDic.type && -1) || (!df_AdmisDic.type && 0);
            }
        };

        //- 鼠标hover事件回调
        this.onMouseHoverEvent = function(func) {
            df_MouseHoverCallback = toFunction(func);
        };
        //- 鼠标点击事件回调
        this.onMouseDownEvent = function(func) {
            df_MouseDownCallback = toFunction(func);
        };
        /**
         * [setTags 更改标签设置]
         * @Author   ZHOUPU
         * @DateTime 2018-08-02
         * @param    {[object]}   opt [{showTags: 是否显示true/false, fontColor: 颜色, fontHover: 高亮颜色, fontSize: 大小系数1-10, fontWeight: 1-正常/2-加粗}]
         */
        this.setTags = function(opt) {
            if (thm.is_Init) {
                df_Config.tags.showTags = opt.showTags != undefined ? opt.showTags : df_Config.tags.showTags;
                df_Config.tags.fontColor = opt.fontColor != undefined ? opt.fontColor : df_Config.tags.fontColor;
                df_Config.tags.fontHover = opt.fontHover != undefined ? opt.fontHover : df_Config.tags.fontHover;
                df_Config.tags.fontSize = opt.fontSize != undefined ? opt.fontSize : df_Config.tags.fontSize;
                df_Config.tags.fontWeight = opt.fontWeight != undefined ? opt.fontWeight : df_Config.tags.fontWeight;
                _Collects.handleTags(true);
            }
        };

        /**
         * [setTagsText 更改标签 文字]
         * @Author   ZHOUPU
         * @DateTime 2018-08-02
         * @param    {[string]}   id    [所属区块id]
         * @param    {[string]}   name  [文字信息]
         * @param    {[string]}   coord [coord信息]
         * @param    {[number]}   offx  [横向偏移，右为正]
         * @param    {[number]}   offy  [竖向偏移，下为正]
         * @param    {[number]}   sd  [解析分段数  1.6-3.2 默认2.4]
         * @param    {[Boolean]}   fst  [填充方式  true-内孔  false-外区块， 默认false]
         */
        this.setTagsText = function(id, name, coord, offx, offy, sd, fst) {
            if (thm.is_Init) {
                _Collects.handleTagsText(id, name || "", coord || "", offx, offy, sd, fst);
            }
        };
        /**
         * [setBlock 更改区块设置]
         * @Author   ZHOUPU
         * @DateTime 2018-08-02
         * @param    {[object]}   opt     [{blockColor:区块颜色数组, highLightColor:高亮颜色}]
         * @param    {Boolean}  isClear [是否清除渲染设置颜色]
         */
        this.setBlock = function(opt, isClear) {
            if (thm.is_Init) {
                df_Config.sceneStyle.blockColor = opt.blockColor != undefined ? opt.blockColor : df_Config.sceneStyle.blockColor;
                df_Config.sceneStyle.highLightColor = opt.highLightColor != undefined ? opt.highLightColor : df_Config.sceneStyle.highLightColor;

                df_Clear = isClear != undefined ? (isClear === true) : df_Clear;
                _Collects.handleBlock(true);
            }
        };
        /**
         * [setBlockTexture 更改区块纹理设置]
         * @Author   ZHOUPU
         * @DateTime 2018-08-29
         * @param    {[object]}   opt     [{blockTexture:纹理图片}}]
         * @param    {Boolean}  isClear [是否清除渲染设置颜色]
         */
        this.setBlockTexture = function(opt, isClear) {
            if (thm.is_Init) {
                df_Config.sceneStyle.blockTexture = opt.blockTexture != undefined ? opt.blockTexture : df_Config.sceneStyle.blockTexture;

                df_Clear = isClear != undefined ? (isClear === true) : df_Clear;
                _Collects.handleBlock(true);
            }
        };
        /**
         * [setBorder 更改边框设置]
         * @Author   ZHOUPU
         * @DateTime 2018-08-02
         * @param    {[object]}   opt [{borderColor:区块边框颜色, borderWidth:区块边框粗细0.1-5}]
         */
        this.setBorder = function(opt) {
            if (thm.is_Init) {
                df_Config.sceneStyle.borderColor = opt.borderColor != undefined ? opt.borderColor : df_Config.sceneStyle.borderColor;
                df_Config.sceneStyle.borderWidth = opt.borderWidth != undefined ? opt.borderWidth : df_Config.sceneStyle.borderWidth;
                df_Config.sceneStyle.borderStyle = opt.borderStyle != undefined ? opt.borderStyle : df_Config.sceneStyle.borderStyle;
                df_Config.sceneStyle.borderHLColor = opt.borderHLColor != undefined ? opt.borderHLColor : df_Config.sceneStyle.borderHLColor;

                _Collects.handleBorder(true);
            }
        };
        /**
         * [setBlock 更改外边框设置]
         * @Author   ZHOUPU
         * @DateTime 2018-08-02
         * @param    {[object]}   opt     [{outBorderColor:外边框颜色数组, outBorderWidth:外边框顶线粗细0.1-5}]
         */
        this.setOutBorder = function(opt) {
            if (thm.is_Init) {
                df_Config.sceneStyle.outBorderColor = opt.outBorderColor != undefined ? opt.outBorderColor : df_Config.sceneStyle.outBorderColor;
                df_Config.sceneStyle.outBorderWidth = opt.outBorderWidth != undefined ? opt.outBorderWidth : df_Config.sceneStyle.outBorderWidth;

                _Collects.handleOutBorder(true);
            }
        };
        /**
         * [setGlow 更改外发光设置]
         * @Author   ZHOUPU
         * @DateTime 2018-08-02
         * @param    {[object]}   opt [{glowShow:是否显示, glowColor:颜色, glowSize:大小(.1-5) }]
         */
        this.setGlow = function(opt) {
            if (thm.is_Init) {
                df_Config.outerGlow.glowShow = opt.glowShow != undefined ? opt.glowShow : df_Config.outerGlow.glowShow;
                df_Config.outerGlow.glowColor = opt.glowColor != undefined ? opt.glowColor : df_Config.outerGlow.glowColor;
                df_Config.outerGlow.glowSize = opt.glowSize != undefined ? opt.glowSize : df_Config.outerGlow.glowSize;
                df_Config.outerGlow.glowPlace = opt.glowPlace != undefined ? opt.glowPlace : df_Config.outerGlow.glowPlace;

                _Collects.handleGlow(true);
            }
        };
        /**
         * [setPoint 更改光点设置]
         * @Author   ZHOUPU
         * @DateTime 2018-08-29
         * @param    {[object]}   opt [{pointShow:是否显示, pointColor:颜色, pointSize:大小(.1-5), pointDensity:密度(1-5), perTime:闪烁周期(1-5) }]
         */
        this.setPoint = function(opt) {
            if (thm.is_Init) {
                df_Config.outerGlow.pointShow = opt.pointShow != undefined ? opt.pointShow : df_Config.outerGlow.pointShow;
                df_Config.outerGlow.pointColor = opt.pointColor != undefined ? opt.pointColor : df_Config.outerGlow.pointColor;
                df_Config.outerGlow.pointSize = opt.pointSize != undefined ? opt.pointSize : df_Config.outerGlow.pointSize;
                df_Config.outerGlow.pointDensity = opt.pointDensity != undefined ? opt.pointDensity : df_Config.outerGlow.pointDensity;
                df_Config.outerGlow.perTime = opt.perTime != undefined ? opt.perTime : df_Config.outerGlow.perTime;

                _Collects.handlePoint(true);
            }
        };
        /**
         * [setPointTexture 更改光点样式设置]
         * @Author   ZHOUPU
         * @DateTime 2018-08-29
         * @param    {[object]}   opt     [{pointTexture:光点样式}}]
         */
        this.setPointTexture = function(opt) {
            if (thm.is_Init) {
                df_Config.outerGlow.pointTexture = opt.pointTexture != undefined ? opt.pointTexture : df_Config.outerGlow.pointTexture;

                _Collects.handlePoint(true);
            }
        };
        /**
         * [setShadow 更改阴影配置参数]
         * @Author   ZHOUPU
         * @DateTime 2018-07-28
         * @param    {[object]}   opt [{shadowColor: 投影颜色, shadowRate: 投影高度(0.1-10), shadowType:投影方式(0-全体投影,1-多层投影,默认0), shadowLayers:投影层数 2层、3层}]
         */
        this.setShadow = function(opt) {
            if (thm.is_Init) {
                df_Config.controls.shadowColor = opt.shadowColor != undefined ? opt.shadowColor : df_Config.controls.shadowColor;
                df_Config.controls.shadowRate = opt.shadowRate != undefined ? opt.shadowRate : df_Config.controls.shadowRate;
                df_Config.controls.shadowType = opt.shadowType != undefined ? opt.shadowType : df_Config.controls.shadowType;
                df_Config.controls.shadowLayers = opt.shadowLayers != undefined ? opt.shadowLayers : df_Config.controls.shadowLayers;

                _Collects.handleShadow(true);
            }
        };
        /**
         * [setSuspend 更改悬浮设置]
         * @Author   ZHOUPU
         * @DateTime 2018-08-02
         * @param    {[object]}   opt [{suspend:是否悬浮true/false}]
         */
        this.setSuspend = function(opt) {
            if (thm.is_Init) {
                df_Config.controls.suspend = opt.suspend != undefined ? opt.suspend : df_Config.controls.suspend;

                _Collects.handleSuspend();
            }
        };
        /**
         * [setBMouseDown 更改区块点击效果]
         * @Author   ZHOUPU
         * @DateTime 2018-08-29
         * @param    {[object]}   opt [{blockMouseDown:区块点击  0-无   1-单击放大   2-双击放大}]
         */
        this.setBMouseDown = function(opt) {
            if (thm.is_Init) {
                return;
                df_Config.controls.blockMouseDown = opt.blockMouseDown != undefined ? opt.blockMouseDown : df_Config.controls.blockMouseDown;

                _Collects.handleBMouseDown();
            }
        };
        /**
         * [setLayerTagLength 设置所有图层标签长度]
         * @Author   ZHOUPU
         * @DateTime 2018-08-29
         * @param    {[object]}   opt [{layerTagLength:图层标签长度  取值  1,2,3  默认1}]
         */
        this.setLayerTagLength = function(opt) {
            if (thm.is_Init) {
                df_Config.controls.layerTagLength = opt.layerTagLength != undefined ? opt.layerTagLength : df_Config.controls.layerTagLength;
                df_Config.controls.layerTagLength = _Collects.limit(df_Config.controls.layerTagLength * 1, [1, 2, 3]);
                thm.LayerTagLength = df_Config.controls.layerTagLength;
            }
        };
        /**
         * [setDataMatchType 设置匹配方式  1-精确匹配，2-模糊匹配，默认2]
         * @Author   ZHOUPU
         * @DateTime 2019-06-03
         * @param    {[type]}   opt [ {dataMatchType: 1/2} ]
         */
        this.setDataMatchType = function(opt) {
            if (thm.is_Init) {
                thm.dataMatchType = _Collects.limit(opt.dataMatchType * 1, [2, 1]);;
            }
        };
        /**
         * [setControls 更改控制设置]
         * @Author   ZHOUPU
         * @DateTime 2018-08-02
         * @param    {[object]}   opt [{enablePan:平移true/false, enableZoom:缩放true/false, enableRotate:旋转true/false}]
         */
        this.setControls = function(opt) {
            if (thm.is_Init) {
                df_Config.controls.enablePan = opt.enablePan != undefined ? opt.enablePan : df_Config.controls.enablePan;
                df_Config.controls.enableZoom = opt.enableZoom != undefined ? opt.enableZoom : df_Config.controls.enableZoom;
                df_Config.controls.enableRotate = opt.enableRotate != undefined ? opt.enableRotate : df_Config.controls.enableRotate;

                _Collects.handleControls();
                setControls(thm.controls, df_Config.controls);
            }
        };

        //- 是否高亮
        this.isHighlight = function(opt) {
            if (thm.is_Init) {
                df_Config.sceneStyle.isHighlight = opt.isHighlight != undefined ? !!opt.isHighlight : df_Config.sceneStyle.isHighlight;
            }
        };
        //- 是否颜色融合
        this.isGlowBlending = function(opt) {
            if (thm.is_Init) {
                df_Config.outerGlow.isGlowBlending = opt.isGlowBlending != undefined ? !!opt.isGlowBlending : df_Config.outerGlow.isGlowBlending;
                _Collects.handleGlowBlending(true);
            }
        };
        /***************************************************/
        /**
         * [setRangeParam 更改值域渲染参数]
         * @Author   ZHOUPU
         * @DateTime 2018-08-02
         * @param    {[object]}   opt [{maximum:最大值, minimum:最小值, colorArray:颜色数组[最小值颜色, ... , 最大值颜色]}]
         */
        this.setRangeParam = function(opt) {
            if (thm.is_Init) {
                opt = opt || {};
                if (!df_DistMap.__worked) {
                    df_DistMap = $.extend(true, {}, default_DistributionMap, opt);
                } else {
                    df_DistMap.colorArray = [];
                    df_DistMap = $.extend(true, {}, df_DistMap, opt);
                }
                _Collects.handleRangeParam();
            }
        };
        /**
         * [getDistColor 根据权重获取值域颜色]
         * @Author   ZHOUPU
         * @DateTime 2018-09-08
         * @param    {[number]}   weight [权重值]
         * @return   {[array]} [颜色数组，颜色和透明度分开]
         */
        this.getDistColor = function(weight) {
            var colors;
            if (thm.is_Init && df_DistMap.__worked) {
                colors = _Collects.getDistColor(weight);
            } else {
                colors = weight;
            }
            return colors;
        };

        /**
         * [setDistributionMap 更改分布地图设置]
         * @Author   ZHOUPU
         * @DateTime 2018-08-02
         * @param    {[object]}   param  [渲染参数:{ id: [blockColor, borderColor], ... }]
         */
        this.setDistributionMap = function(param) {
            if (thm.is_Init) {
                _Collects.handleDistMap(param);
            }
        };
        /**
         * [setBlowAnima 设置放大还原动画]
         * @Author   ZHOUPU
         * @DateTime 2018-09-06
         */
        this.setBlowAnima = function() {
            if (df_tAnim.type == 1) {
                df_onAnim = true;
                df_tAnim.SId = 0;
                df_tAnim.type = 2;
                df_tAnim.node = null;
                df_tAnim.showArr = [];
                df_tAnim.transTimes = 0;
            }
        };
        /*
         * @Author TangChengchuan
         * @Date 2019/4/8
         * @Description setCarouseTarget 设置轮播图层
         * @param {[opt]} object
         */

        this.setCarouseTarget = function(opt, needCancel) {
            if (df_CarouselType == opt.type && df_carouselIndex == opt.index) return;
            if (!needCancel) {
                this.setCarouseTarget({
                    index: df_carouselIndex,
                    type: false
                }, true);
                df_carouselIndex = opt.index;
                df_CarouselType = opt.type;
            }
            if (opt.index === 'null') {
                this.setCarouselStart(opt.type);
            } else {
                this.pointMap && this.pointMap.setCarouselStart && this.pointMap.setCarouselStart(opt.index, opt.type);
            }

        };

        /*
         * @Author TangChengchuan
         * @Date 2019/4/8
         * @Description setCarouselTimes 设置轮播图层
         * @param {[opt]} object
         */

        this.setCarouselTimes = function(opt) {
            opt.value = opt.value === '' ? 3 : opt.value;
            if (opt.index === 'null') {
                this.setCarouselTime(opt.value || 0);
            } else {
                this.pointMap && this.pointMap.setCarouselTime && this.pointMap.setCarouselTime(opt.index, opt.value || 0);
            }
        };

        /**
         * [setCarouselStart 是否开启轮播]
         * @Author   DUKAI
         * @DateTime 2019-04-02T11:01:52+0800
         * @param    {[type]}                 value [description]
         */
        this.setCarouselStart = function(value) {
            df_Carousel = value;
            df_carouTransTime = 0;
        };
        /**
         * [setCarouselTime 设置轮播间隔时间]
         * @Author   DUKAI
         * @DateTime 2019-04-02T11:03:24+0800
         * @param    {[type]}                 value [description]
         */
        this.setCarouselTime = function(value) {
            df_carouTime = value;
        };
        this.setCarouseCallback = function(func) {
            df_carouCallback = toFunction(func);
        };
        /**
         * [_df_Tdata 默认参数：大小系数、浮动高度、纹理对象等]
         * @type {Object}
         */
        this._df_Tdata = {
            M_PI: 6.2831853071795865,
            M_PI2: 1.57079632679489662,
            wh: 400,
            gs: 200,
            ps: 240,
            py: 2.4,
            ry: .1,
            txues: {}
        };

        //-
        var thm = this;
        //内部变量
        var df_Raycaster, df_Mouse, df_Intersects, df_ItdMesh, df_SltMesh, df_MouseEvent = false; //事件变量
        var df_Clock, df_raf, df_shapeLable, df_shadowMtl, df_middleMtl,
            df_Width = 0,
            df_Height = 0,
            df_Clear = false,
            df_dbClickDelay = 0,
            df_animationArr = []; //essential
        //图层序号参数
        var df_DeleteIndex = Infinity;
        //- callback
        var df_ErrorCallback = toFunction(),
            df_MouseDownCallback = toFunction(),
            df_MouseHoverCallback = toFunction(),
            df_MouseDoubleClickCallback = toFunction(),
            df_OnRenderCallback = {};

        //- 点击放大
        var df_onAnim = false;
        var df_tAnim = {
            id: [], //区块id
            SId: 0,
            showArr: [],
            type: 0, //类型
            perTime: .8, //周期时间
            transTimes: 0,
            node: null,
            WHRatio: null,
            svgOffset: null
        };

        //-轮播
        var df_Carousel = false;
        var df_CarouselType = false;
        var df_carouselIndex = 'null';
        var df_carouTime = 2;
        var df_carouID = 0;
        var df_carouTransTime = 0;
        var df_currentObj;
        var df_carouCallback;

        //- AdmissionDynamic
        var df_AdmisDic = {};
        var default_AdmissionDynamic = { //入场动画
            type: 0, //三种效果，0 / 1 / 2, 0：没有效果， 1：淡入 ， 2：收缩
            perTime: 1.8, //周期时间，单位 秒
            _transTimes: -1, //过渡时间
        };

        //- DistributionMap  Range
        var df_DistMap = {};
        var default_DistributionMap = { //-值域渲染，色系采用 HSL
            maximum: 1000, //最大值
            minimum: 0, //最小值
            colorArray: [], //颜色数组，[ 最小值颜色, ... , 最大值颜色 ]
        };

        //- default setting
        var df_Config = {};
        var default_Config = {
            tags: {
                showTags: false, //是否显示标签  true / false,  默认 false
                fontColor: "#ffffff", //字体颜色，  RGBA
                fontHover: "#ff0000", //鼠标悬浮字体颜色，RGBA
                fontSize: 3, //字体大小，范围 1-10
                fontWeight: 1, //字体粗细， 1 / 2  正常 / 加粗
            },
            sceneStyle: {
                blockColor: ['#A3B0B0'], //区块的颜色  RGBA
                highLightColor: "#2CE3E3", //区块高亮颜色  RGBA
                isHighlight: true, //鼠标移入是否高亮

                blockTexture: null, //  区块纹理 默认 null

                borderColor: "#3A9595", //边框颜色  RGBA
                borderWidth: 2, //边框粗细，相对大小  .1-5
                borderStyle: 2, //边框样式 1-向内， 2-中间  3-向外
                borderHLColor: '#0067FF', //边框高亮颜色 RGBA

                outBorderColor: [], //外边框颜色  rgba 数组 ['#3A9595','#3A9595','#3A9595']  之前版本没有  取 borderColor 值
                outBorderWidth: 2, //外边框顶线粗细   .1-5  之前版本没有  取 borderWidth 值
            },
            outerGlow: {
                glowShow: false, //外发光 显示或隐藏   true/false  由 type 属性分拆
                glowColor: "#89FEFE", //外发光颜色  RGBA
                glowSize: 1, // 外发光光点  大小  .1-5
                glowPlace: 1, // 外发光位置  0.1-1  0.1——居上, 1——底部
                isGlowBlending: true, //外发光颜色是否采用融合模式

                pointShow: false, //光点 显示或隐藏   true/false  由 type 属性分拆
                pointColor: "#89FEFE", //光点颜色  RGBA  C07版本没有  取 glowColor 值
                pointSize: 1, //光点大小  大小  .1-5
                pointDensity: 1, //光点密度  1-5   值越大，点越多 步段为1
                perTime: 2, // 光点  闪烁速度  .1-5

                pointTexture: null, //点样式图片
            },
            controls: {
                //-
                shadowColor: "#45CDC1", //投影颜色  RGBA
                shadowRate: 5, //投影系数  相对大小  .1-10
                shadowType: 0, //投影方式   0-全体投影   1-多层投影  默认 0
                shadowLayers: 2, //投影层数   2层、3层

                suspend: true, //是否悬浮  true / false,
                blockMouseDown: 0, //区块点击  0-无   1-单击放大   2-双击放大

                layerTagLength: 1, //图层标签长度  取值  1,2,3  默认1

                //- 控制器
                enablePan: true, // 平移
                enableZoom: true, // 缩放
                enableRotate: true, // 旋转

                //- 控制器内部默认值
                enableDamping: true, //是否阻尼
                dampingFactor: 0.1, //阻尼系数
                panSpeed: 0.1, //平移系数
                zoomSpeed: 0.1, //缩放系数
                rotateSpeed: 0.013, //旋转系数
                distance: [485, 6020], //缩放距离区间
                polarAngle: [0, Math.PI * .43], //上下旋转区间
                azimuthAngle: [-Infinity, Infinity], //左右旋转区间
            },

            background: {
                color: '#ffffff', //背景色
                opacity: 0 //背景透明度
            },
            camera: {
                fov: 10,
                near: 100,
                far: 10000,
                position: [0, 1740, 1960]
            },
            light: {
                Ambient: {
                    color: '#FFFFFF', //环境光
                    strength: 1.0 //环境光强度
                },
                isHemisphere: false,
                isDirectional: true,
                hemisphere: {
                    color: '#EFEFEF',
                    groundColor: '#EFEFEF',
                    strength: 0.7,
                    position: [0, 0, 200]
                },
                directional: {
                    color: '#1A1A1A',
                    strength: 1.0,
                    position: [75, 100, 75]
                },
            },
            texture: {},
        };

        /**
         * [initiate 初始化场景、相机、控制器、渲染器、灯光、事件等]
         * @Author   ZHOUPU
         * @DateTime 2018-08-01
         * @return   {[void]}
         */
        function initiate() {

            thm.WHRatio = new THREE.Vector3(1, 1, 1);
            thm.svgOffset = new THREE.Vector3(0, 0, 0);

            thm.scene = new THREE.Scene();
            df_Clock = new THREE.Clock();

            var wh = getWH();
            df_Width = wh.w;
            df_Height = wh.h;
            var cm = df_Config.camera,
                bg = df_Config.background;

            thm.camera = new THREE.PerspectiveCamera(cm.fov, wh.w / wh.h, cm.near, cm.far);
            thm.camera.position.set(cm.position[0], cm.position[2], cm.position[1]);
            thm.camera.lookAt(thm.scene.position);

            // renderer
            thm.renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true
            });
            thm.renderer.shadowMap.enabled = df_Config.controls.shadow;
            thm.renderer.setClearColor(bg.color, bg.opacity);
            thm.renderer.setSize(df_Width, df_Height);
            thm.renderer.setPixelRatio(1);

            // controls
            _Collects.handleControls();
            thm.controls = new THREE.OrbitControls(thm.camera, thm.container[0]);
            setControls(thm.controls, df_Config.controls, true);

            // lights
            setLight(thm.scene, df_Config.light);

            thm.container.append($(thm.renderer.domElement));

            // mouse event
            df_Mouse = new THREE.Vector2();
            df_Raycaster = new THREE.Raycaster();
            thm.container[0].addEventListener('mouseout', onDocumentMouseOut, false);
            thm.container[0].addEventListener('mousemove', onDocumentMouseMove, false);
            thm.container[0].addEventListener('mousedown', onDocumentMouseDown, false);
            thm.container[0].addEventListener('dblclick', onDocumentMousedblclick, false);
        }

        /**
         * [_Shaders 默认着色器]
         * @type {Object}
         */
        var _Shaders = {
            ShapeVShader: [
                'uniform vec3 u_color; uniform float u_opacity; ',
                'uniform vec2 u_offset; uniform vec2 u_WH; ',
                'varying vec4 vColor; varying vec2 vUv; void main() {',
                'vec2 nuv = clamp( ( uv - u_offset + u_WH*.5 ) / u_WH, 0.0, 1.0 );',
                'vColor = vec4( u_color, u_opacity ); vUv = vec2( nuv.x, 1.0-nuv.y ); ',
                'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
                '}'
            ].join("\n"),
            ShadowVShader: [
                'uniform vec3 u_color; uniform float u_opacity; uniform vec4 u_showGId; ',
                'attribute float cId; varying vec4 vColor; varying float isShow; ',
                'void main() { float k = floor(cId); ',
                'float a = floor(u_showGId[0]), b = floor(u_showGId[1]), ',
                '      c = floor(u_showGId[2]), d = floor(u_showGId[3]); ',
                'if ( a<0.0 && b<0.0 && c<0.0 && d<0.0 ) { isShow = 1.0; } ',
                'else if( k == a || k == b || k == c || k == d ) { isShow = 1.0; } ',
                'else { isShow = -1.0; } ',
                'vColor = vec4( u_color, u_opacity ); ',
                'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
                '}'
            ].join("\n"),
            SplineVShader: [
                "uniform vec3 u_color; uniform float u_opacity; uniform float u_width;",
                "uniform float u_type; attribute float cRatio; attribute vec3 cPosition;",
                "varying vec4 vColor; varying vec2 vUv; varying float isShow; void main() { ",
                "vec3 nPosition = position; float k = 20.0, m = cRatio*u_type;",
                "if ( m>.0 && m<.5 ) { nPosition.y = u_width; } ",
                // 1
                "if ( m>.5 && m<1.5 ) { nPosition = cPosition*u_width+position; } ",
                // 2
                "if ( m>1.5 && m<2.5 ) { nPosition = cPosition*u_width/2.0+position; } ",
                "if ( m>-2.5 && m<-1.5 ) { nPosition = -cPosition*u_width/2.0+position; } ",
                // 3
                "if ( m>2.5 && m<3.5 ) { ",
                "nPosition = -cPosition*k+position; nPosition.y = u_width/2.0; } ",
                "if ( m>-3.5 && m<-2.5 ) { ",
                "nPosition = cPosition*k+position; nPosition.y = -u_width/2.0; } ",
                // 4
                "if ( m>3.5 && m<4.5 ) { ",
                "nPosition = -cPosition*k+position; nPosition.y = -u_width/2.0; } ",
                "if ( m>-4.5 && m<-3.5 ) { ",
                "nPosition = cPosition*k+position; nPosition.y = u_width/2.0; } ",

                "vColor = vec4( u_color, u_opacity ); vUv = uv; isShow = 1.0;",
                "vec4 mP = modelViewMatrix * vec4( nPosition, 1.0 ); ",
                "gl_Position = projectionMatrix * mP; } "
            ].join("\n"),
            PointVShader: [
                'uniform vec3 u_color; uniform float u_opacity; uniform float u_pd; ',
                'uniform float u_size; attribute float pId; varying vec4 vColor; ',
                'varying float isShow; void main() { ',
                'float n = floor( pId/u_pd ); isShow = -1.0; ',
                'if( (pId - u_pd * n) == (u_pd-1.0) ) { isShow = 1.0; } ',

                'vColor = vec4( u_color, u_opacity ); ',
                'vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',
                'gl_PointSize = u_size * ( 1.0 / -mvPosition.z );',
                // 'gl_PointSize = u_size * ( 256.0 / length( mvPosition.xyz ) );',
                'gl_Position = projectionMatrix * mvPosition; ',
                '}'
            ].join("\n"),

            ShadowFShader: [
                "varying vec4 vColor; varying float isShow;",
                "void main() { if(isShow<0.0) discard; else gl_FragColor = vColor; } ",
            ].join("\n"),
            BorderFShader: [
                "uniform sampler2D u_txue; varying vec4 vColor;  varying vec2 vUv;",
                "void main() {  gl_FragColor = vColor * texture2D(u_txue, vUv); } ",
            ].join("\n"),
            PointFShader: [
                "uniform sampler2D u_txue; varying vec4 vColor; varying float isShow; ",
                "void main() { if(isShow<0.0) discard; else gl_FragColor = vColor * texture2D(u_txue, gl_PointCoord); } ",
            ].join("\n"),
        };

        /**
         * [_Collects 公用方法集合]
         * @type {Object}
         */
        var _Collects = {
            obj: function() {
                return new THREE.Object3D();
            },
            color: function(c) {
                return new THREE.Color(c);
            },
            //多材质
            setMulti: function(arr) {
                return new THREE.MultiMaterial(arr);
            },

            //-
            creatCGeo: function(p) {
                return new THREE.CurvePath().createGeometry(p)
            },
            tgShape: function(c, h) {
                return THREE.ShapeUtils.triangulateShape(c, h);
            },
            //平移 旋转矩阵
            Matrix: function(fxy, rx) {
                var _m4 = new THREE.Matrix4();
                if (rx) {
                    _m4.makeRotationX(_Collects.clamp(rx * 1, -Infinity, Infinity, 0));
                } else {
                    _m4.makeRotationX(thm._df_Tdata.M_PI2);
                }
                if (fxy) {
                    fxy[0] = _Collects.clamp(fxy[0] * 1, -Infinity, Infinity, 0);
                    fxy[1] = _Collects.clamp(fxy[1] * 1, -Infinity, Infinity, 0);
                    _m4.setPosition(new THREE.Vector3(fxy[0], 0, fxy[1]));
                }
                return _m4;
            },
            //shape点的顺序是否顺时针
            reverse: function(c) {
                if (!THREE.ShapeUtils.isClockWise(c)) c = c.reverse();
            },
            //hole点的顺序是否逆时针
            holeReverse: function(c) {
                if (THREE.ShapeUtils.isClockWise(c)) c = c.reverse();
            },
            // 数值大小范围限制
            clamp: function(v, mi, ma, df) {
                return Math.min(ma, Math.max(mi, isNaN(v) ? df : v));
            },
            // 数值取值限制
            limit: function(v, arr) {
                return (arr.indexOf(v) != -1) ? v : arr[0];
            },

            //缓动函数
            easing: function(k, func) {
                if (isFunction(func)) return func(k);
                else return k;
            },
            ease1: function(k) {
                k *= 2;
                return (k > 1) ? 0.5 * k * (k - 2) + 1 : 0.5 * k * (2 - k);
            },
            ease2: function(k) {
                k *= 2;
                return 0.5 * (--k * k * k + 1);
            },
            ease3: function(k) {
                return k * (2 - k);
            },

            //- opacity traverse
            opacityTvs: function(obj, val) {
                val = isNaN(val * 1) ? 1 : val * 1;
                obj.traverse(function(child) {
                    if (!child._isshapeLable && child.material && child._opacity) {
                        if (!child.material.uniforms) child.material.opacity = child._opacity * val;
                        else child.material.uniforms.u_opacity.value = child._opacity * val;
                    }
                });
            },

            //- 预处理
            /**
             * [handleTags 预处理/改变标签 字体颜色、高亮颜色、大小系数 参数]
             * @Author   ZHOUPU
             * @DateTime 2018-08-01
             * @param    {Boolean}  isChange [区分是否改变参数或只是预处理参数]
             * @return   {[void]}
             */
            handleTags: function(isChange) {
                //- 标签
                var fc = df_Config.tags.fontColor,
                    fh = df_Config.tags.fontHover,
                    fs = df_Config.tags.fontSize * 1;

                df_Config.tags.showTags = (df_Config.tags.showTags === true);
                df_Config.tags.fontColor = _Collects.getColorArr(fc);
                df_Config.tags.fontHover = _Collects.getColorArr(fh);
                df_Config.tags.fontSize = _Collects.clamp(fs, 1, 10, 3);
                df_Config.tags.fontWeight = (df_Config.tags.fontWeight == 2) ? 2 : 1;

                //- 是否改变
                if (isChange) {
                    var st = df_Config.tags.showTags,
                        fw = df_Config.tags.fontWeight;
                    fc = df_Config.tags.fontColor;
                    fh = df_Config.tags.fontHover;
                    fs = df_Config.tags.fontSize;
                    for (var i = thm.shapesArrLen - 1; i >= 0; i--) {
                        var shiC0T = thm.shapesArr[i].children[0].children[3];

                        var _t = shiC0T._txueArr[fw],
                            _s = _t._scale * fs * (22 - fs) * .18;

                        shiC0T.visible = shiC0T._visible = st;
                        shiC0T._color = fc[0];
                        shiC0T._opacity = fc[1];
                        shiC0T._hlColor = fh[0];
                        shiC0T._hlOpacity = fh[1];

                        shiC0T.position.y = fs * (22 - fs) * .18;

                        shiC0T.material.color.set(fc[0]);
                        shiC0T.material.opacity = fc[1];
                        shiC0T.material.size = _s;
                        shiC0T.material.map.dispose();
                        shiC0T.material.map = _t;
                    }
                }
            },
            /**
             * [handleTagsText 根据id处理标签文字&coord]
             * @Author   ZHOUPU
             * @DateTime 2018-08-01
             * @param    {[string]}   id    [所属区块ID]
             * @param    {[string]}   name  [标签文字]
             * @param    {[string]}   coord [coord]
             * @param    {[number]}   offx  [x左右偏移，右为正]
             * @param    {[number]}   offy  [y上下偏移，下为正]
             * @param    {[number]}   sd  [解析分段数  1.6-3.2 默认2.4]
             * @param    {[Boolean]}   fst  [填充方式  true-内孔  false-外区块， 默认false]
             * @return   {[void]}
             */
            handleTagsText: function(id, name, coord, offx, offy, sd, fst) {
                offx = _Collects.clamp(offx * 1, -Infinity, Infinity, 0);
                offy = _Collects.clamp(offy * 1, -Infinity, Infinity, 0);
                sd = _Collects.clamp(sd * 1, 1.6, 3.2, 2.4);
                fst = (fst === true);
                var isfirst = 0,
                    fs = df_Config.tags.fontSize;
                for (var i = thm.shapesArrLen - 1; i >= 0; i--) {
                    var shi = thm.shapesArr[i];
                    if (shi._path_id == id) {
                        var shiC0 = shi.children[0],
                            shiC0T = shiC0.children[3];

                        if (isfirst >= 1 || thm.SVGMapObj[id]['name'] != name) {
                            var _txue = _Collects.creatTagsTxue( ( shiC0._bid == 0?name:"" ) ),
                                _t = _txue[df_Config.tags.fontWeight],
                                _s = _t._scale * fs * (22 - fs) * .18;

                            shiC0T._txueArr['1'].dispose();
                            shiC0T._txueArr['2'].dispose();
                            shiC0T.material.map.dispose();

                            shiC0T.material.size = _s;
                            shiC0T.material.map = _t;
                            shiC0T._txueArr = _txue;

                            thm.SVGMapObj[id]['name'] = name;
                            shi._name = shiC0._name = name;
                        }

                        thm.SVGMapObj[id]['coord'] = coord;
                        thm.SVGMapObj[id]['offset'][0] = offx;
                        thm.SVGMapObj[id]['offset'][1] = offy;
                        thm.SVGMapObj[id]['segDensity'] = sd;
                        thm.SVGMapObj[id]['fillStyle'] = fst;
                        shiC0T.geometry.vertices[0] = shiC0T._vec.clone().add(new THREE.Vector3(offx, 0, offy));
                        shiC0T.geometry.verticesNeedUpdate = true;
                        isfirst++;
                    }
                }
            },
            /**
             * [handleBlock 预处理/改变区块 颜色、高亮颜色 参数]
             * @Author   ZHOUPU
             * @DateTime 2018-08-01
             * @param    {Boolean}  isChange [区分是否改变参数或只是预处理参数]
             * @return   {[void]}
             */
            handleBlock: function(isChange) {
                //- 区块 & 区块高亮
                var bc = df_Config.sceneStyle.blockColor,
                    hlc = df_Config.sceneStyle.highLightColor,
                    btx = df_Config.sceneStyle.blockTexture;

                var i, bcArr = [],
                    bl = Math.min(3, Math.max(1, bc.length));
                for (i = 0; i < bl; i++) {
                    bcArr.push(_Collects.getColorArr(bc[i]));
                }

                df_Config.sceneStyle.blockColor = bcArr;
                df_Config.sceneStyle.highLightColor = _Collects.getColorArr(hlc);
                btx = (btx != null && btx != undefined && btx != "") ? btx : null;
                if (btx instanceof THREE.Texture) btx._isOld = true;
                df_Config.sceneStyle.blockTexture = (btx instanceof THREE.Texture || btx == null) ? btx : thm._TxueLoader.load(btx);
                df_Config.sceneStyle.isHighlight = (df_Config.sceneStyle.isHighlight === true); //- 是否高亮  初始化

                //- 是否改变
                if (isChange) {
                    _Collects.setBlockColor();
                }
            },
            /**
             * [handleBorder 预处理/改变边线 颜色、宽度 参数]
             * @Author   ZHOUPU
             * @DateTime 2018-08-01
             * @param    {Boolean}  isChange [区分是否改变参数或只是预处理参数]
             * @return   {[void]}
             */
            handleBorder: function(isChange) {
                //- 边框
                var lc = df_Config.sceneStyle.borderColor,
                    lw = df_Config.sceneStyle.borderWidth * 1,
                    ls = df_Config.sceneStyle.borderStyle * 1,
                    lhc = df_Config.sceneStyle.borderHLColor;

                df_Config.sceneStyle.borderColor = _Collects.getColorArr(lc);
                df_Config.sceneStyle.borderWidth = _Collects.clamp(lw, .1, 5, 1);
                df_Config.sceneStyle.borderStyle = _Collects.limit(ls, [2, 1, 3]);
                df_Config.sceneStyle.borderHLColor = _Collects.getColorArr(lhc);

                //- 是否改变
                if (isChange) {
                    lc = df_Config.sceneStyle.borderColor;
                    lw = df_Config.sceneStyle.borderWidth / thm.WHRatio.x;
                    ls = df_Config.sceneStyle.borderStyle;
                    lhc = df_Config.sceneStyle.borderHLColor;
                    var obc = df_Config.sceneStyle.outBorderColor,
                        sl = df_Config.controls.shadowLayers,
                        lc1 = obc[1] ? obc[1] : lc,
                        lc2 = obc[sl - 1] ? obc[sl - 1] : lc1;
                    for (var i = thm.shapesArrLen - 1; i >= 0; i--) {
                        var shi = thm.shapesArr[i],
                            shiC0L = shi.children[0].children[1],
                            _bcj = thm.SVGMapObj[shi._path_id].__borderColor,
                            _lcolor = _bcj ? _bcj : lc;

                        shiC0L._color = _lcolor[0];
                        shiC0L._opacity = _lcolor[1];
                        shiC0L._hlColor = lhc[0].clone();
                        shiC0L._hlOpacity = lhc[1];
                        shiC0L.material.uniforms.u_color.value.set(_lcolor[0]);
                        shiC0L.material.uniforms.u_opacity.value = _lcolor[1];
                        shiC0L.material.uniforms.u_type.value = (ls == 3) ? 1 : ls;
                        shiC0L.material.uniforms.u_width.value = (ls == 3) ? lw : -lw;
                    }
                    thm.outBorderObj.children.forEach(function(node) {
                        if (node && node.children[0]) {
                            node.children[0].material.uniforms.u_type.value = (ls == 3) ? 1 : ls;
                            node.children[1].material.uniforms.u_type.value = (ls == 3) ? 1 : ls;
                            node.children[2].material.uniforms.u_type.value = (ls == 3) ? 1 : ls;

                            node.children[1]._color = lc1[0];
                            node.children[1]._opacity = lc1[1];
                            node.children[1].material.uniforms.u_color.value.set(lc1[0]);
                            node.children[1].material.uniforms.u_opacity.value = lc1[1];

                            node.children[2]._color = lc2[0];
                            node.children[2]._opacity = lc2[1];
                            node.children[2].material.uniforms.u_color.value.set(lc2[0]);
                            node.children[2].material.uniforms.u_opacity.value = lc2[1];
                        }
                    });
                }
            },
            /**
             * [handleOutBorder 预处理/改变外边线 颜色、宽度 参数]
             * @Author   ZHOUPU
             * @DateTime 2018-08-01
             * @param    {Boolean}  isChange [区分是否改变参数或只是预处理参数]
             * @return   {[void]}
             */
            handleOutBorder: function(isChange) {
                //- 边框
                var obc = df_Config.sceneStyle.outBorderColor,
                    obw = df_Config.sceneStyle.outBorderWidth * 1;

                var i, obcArr = [],
                    obl = Math.min(3, obc.length);
                for (i = 0; i < obl; i++) {
                    obcArr.push(_Collects.getColorArr(obc[i]));
                }

                df_Config.sceneStyle.outBorderColor = obcArr;
                df_Config.sceneStyle.outBorderWidth = _Collects.clamp(obw, .1, 5, 1);

                //- 是否改变
                if (isChange) {
                    var ls = df_Config.sceneStyle.borderStyle,
                        lc = df_Config.sceneStyle.borderColor,
                        obc = df_Config.sceneStyle.outBorderColor,
                        obw = df_Config.sceneStyle.outBorderWidth / thm.WHRatio.x,
                        sl = df_Config.controls.shadowLayers,
                        lc0 = obc[0] ? obc[0] : lc,
                        lc1 = obc[1] ? obc[1] : lc,
                        lc2 = obc[sl - 1] ? obc[sl - 1] : lc1;
                    thm.outBorderObj.children.forEach(function(node) {
                        if (node && node.children[0]) {

                            node.children[0]._color = lc0[0];
                            node.children[0]._opacity = lc0[1];
                            node.children[0].material.uniforms.u_color.value.set(lc0[0]);
                            node.children[0].material.uniforms.u_opacity.value = lc0[1];
                            node.children[0].material.uniforms.u_width.value = (ls == 3) ? obw : -obw;

                            node.children[1]._color = lc1[0];
                            node.children[1]._opacity = lc1[1];
                            node.children[1].material.uniforms.u_color.value.set(lc1[0]);
                            node.children[1].material.uniforms.u_opacity.value = lc1[1];
                            node.children[1].material.uniforms.u_width.value = (ls == 3) ? obw : -obw;

                            node.children[2]._color = lc2[0];
                            node.children[2]._opacity = lc2[1];
                            node.children[2].material.uniforms.u_color.value.set(lc2[0]);
                            node.children[2].material.uniforms.u_opacity.value = lc2[1];
                            node.children[2].material.uniforms.u_width.value = (ls == 3) ? obw : -obw;
                        }
                    });
                }
            },

            /**
             * [handleGlow 预处理外发光 是否显示、颜色、大小 参数]
             * @Author   ZHOUPU
             * @DateTime 2018-08-01
             * @param    {Boolean}  isChange [区分是否改变参数或只是预处理参数]
             * @return   {[void]}
             */
            handleGlow: function(isChange) {
                //- 外发光
                df_Config.outerGlow.glowShow = (df_Config.outerGlow.glowShow === true);
                df_Config.outerGlow.glowColor = _Collects.getColorArr(df_Config.outerGlow.glowColor);
                df_Config.outerGlow.glowSize = _Collects.clamp(df_Config.outerGlow.glowSize * 1, .1, 5, 1);
                df_Config.outerGlow.glowPlace = _Collects.clamp(df_Config.outerGlow.glowPlace * 1, .1, 1, 1);

                //- 是否改变
                if (isChange) {
                    var gsw = df_Config.outerGlow.glowShow,
                        gc = df_Config.outerGlow.glowColor,
                        gs = df_Config.outerGlow.glowSize,
                        gp = df_Config.outerGlow.glowPlace,
                        eh = df_Config.controls.shadowRate;

                    for (var i = thm.shapesArrLen - 1; i >= 0; i--) {
                        var shiC0 = thm.shapesArr[i].children[0],
                            child = shiC0.children[2].children[0];
                        if (child) {

                            var _opt = .1 + .2 * (5 - gs) / 4;
                            child.visible = child._visible = gsw;
                            child.material.size = child._size = (200 + 80 * gs);
                            child.material.color = child._color = gc[0].clone();
                            child.material.opacity = child._opacity = gc[1] * _opt;

                            child.position.y = child._phy = .1 - eh * child._hRatio * gp;
                        }
                    }
                    thm.outBorderObj.children.forEach(function(node) {
                        if (node && node.children[3]) {
                            var child = node.children[3].children[0];

                            var _opt = .1 + .2 * (5 - gs) / 4;
                            child.visible = child._visible = gsw;
                            child.material.size = child._size = (200 + 80 * gs);
                            child.material.color = child._color = gc[0].clone();
                            child.material.opacity = child._opacity = gc[1] * _opt;

                            child.position.y = child._phy = .1 - eh * child._hRatio * gp;
                        }
                    });

                }
            },
            //- 处理外发光融合模式
            handleGlowBlending: function(isChange) {
                df_Config.outerGlow.isGlowBlending = (df_Config.outerGlow.isGlowBlending === true);

                //- 是否改变
                if (isChange) {
                    var gbld = df_Config.outerGlow.isGlowBlending;
                    for (var i = thm.shapesArrLen - 1; i >= 0; i--) {
                        var shiC0 = thm.shapesArr[i].children[0],
                            child = shiC0.children[2].children[0];
                        if (child) {
                            child.material.blending = gbld ? THREE.AdditiveBlending : THREE.NormalBlending;
                        }
                    }
                    thm.outBorderObj.children.forEach(function(node) {
                        if (node && node.children[3]) {
                            var child = node.children[3].children[0];
                            child.material.blending = gbld ? THREE.AdditiveBlending : THREE.NormalBlending;
                        }
                    });
                }
            },
            /**
             * [handlePoint 预处理光点 是否显示、颜色、大小、密度、动画周期 参数]
             * @Author   ZHOUPU
             * @DateTime 2018-08-29
             * @param    {Boolean}  isChange [区分是否改变参数或只是预处理参数]
             * @return   {[void]}
             */
            handlePoint: function(isChange) {
                //- 光点
                df_Config.outerGlow.pointShow = (df_Config.outerGlow.pointShow === true);
                df_Config.outerGlow.pointColor = _Collects.getColorArr(df_Config.outerGlow.pointColor);
                df_Config.outerGlow.pointSize = _Collects.clamp(df_Config.outerGlow.pointSize * 1, .1, 5, 1);
                df_Config.outerGlow.pointDensity = _Collects.clamp(Math.floor(df_Config.outerGlow.pointDensity * 1), 1, 5, 1);

                df_Config.outerGlow.perTime = _Collects.clamp(df_Config.outerGlow.perTime * 1, .1, 5, 2);

                var ptx = df_Config.outerGlow.pointTexture;
                ptx = (ptx != null && ptx != undefined && ptx != "") ? ptx : null;
                if (ptx instanceof THREE.Texture) ptx._isOld = true;
                df_Config.outerGlow.pointTexture = (ptx instanceof THREE.Texture || ptx == null) ? ptx : thm._TxueLoader.load(ptx);

                //- 是否改变
                if (isChange) {
                    var psw = df_Config.outerGlow.pointShow,
                        pc = df_Config.outerGlow.pointColor,
                        ps = df_Config.outerGlow.pointSize,
                        pd = df_Config.outerGlow.pointDensity,
                        pt = df_Config.outerGlow.perTime,
                        ptxue = df_Config.outerGlow.pointTexture;

                    for (var i = thm.shapesArrLen - 1; i >= 0; i--) {
                        var shiC0 = thm.shapesArr[i].children[0],
                            child = shiC0.children[2].children[1];
                        if (child) {

                            child._perTimes = pt;
                            child.visible = child._visible = psw;

                            child._color = pc[0].clone();
                            child.material.uniforms.u_pd.value = 6 - pd;
                            child.material.uniforms.u_color.value.set(pc[0]);
                            child.material.uniforms.u_opacity.value = child._opacity = pc[1];
                            child.material.uniforms.u_size.value = (200 + 170 * ps) * df_Height * 0.5;

                            if (ptxue && !ptxue._isOld) {
                                if (child.material.uniforms.u_txue.value) {
                                    child.material.uniforms.u_txue.value.dispose();
                                }
                                child.material.uniforms.u_txue.value = ptxue;
                            }
                        }
                    }
                    thm.outBorderObj.children.forEach(function(node) {
                        if (node && node.children[3]) {
                            var child = node.children[3].children[1];

                            child._perTimes = pt;
                            child.visible = child._visible = psw;

                            child._color = pc[0].clone();
                            child.material.uniforms.u_pd.value = 6 - pd;
                            child.material.uniforms.u_color.value.set(pc[0]);
                            child.material.uniforms.u_opacity.value = child._opacity = pc[1];
                            child.material.uniforms.u_size.value = (200 + 170 * ps) * df_Height * 0.5;

                            if (ptxue && !ptxue._isOld) {
                                if (child.material.uniforms.u_txue.value) {
                                    child.material.uniforms.u_txue.value.dispose();
                                }
                                child.material.uniforms.u_txue.value = ptxue;
                            }
                        }
                    });
                }
            },

            //处理控制器 平移、缩放、旋转 开关
            handleControls: function() {
                //- 控制器
                df_Config.controls.enablePan = (df_Config.controls.enablePan === true);
                df_Config.controls.enableZoom = (df_Config.controls.enableZoom === true);
                df_Config.controls.enableRotate = (df_Config.controls.enableRotate === true);
            },

            /**
             * [handleShadow 预处理/改变投影 颜色、高度系数 系数]
             * @Author   ZHOUPU
             * @DateTime 2018-08-01
             * @param    {Boolean}  isChange [区分是否改变参数或只是预处理参数]
             * @return   {[void]}
             */
            handleShadow: function(isChange) {
                //- 投影
                var sc = df_Config.controls.shadowColor,
                    eh = df_Config.controls.shadowRate * 1;

                df_Config.controls.shadowColor = _Collects.getColorArr(sc);
                df_Config.controls.shadowRate = _Collects.clamp(eh, .1, 10, 5);
                df_Config.controls.shadowType = _Collects.limit(df_Config.controls.shadowType * 1, [0, 1]);
                df_Config.controls.shadowLayers = _Collects.limit(df_Config.controls.shadowLayers * 1, [2, 3]);

                //- 是否改变
                if (isChange) {
                    sc = df_Config.controls.shadowColor;
                    eh = df_Config.controls.shadowRate;
                    var bc = df_Config.sceneStyle.blockColor,
                        stp = df_Config.controls.shadowType,
                        sl = df_Config.controls.shadowLayers;

                    var maxEH = 0;
                    var sc0 = (bc[1] && stp == 1) ? bc[1] : sc,
                        sc1 = (bc[sl - 1] && stp == 1) ? bc[sl - 1] : sc0,
                        mp = (bc[1] && stp == 1) ? 1 : 0.85,
                        sp = (bc[sl - 1] || stp == 0) ? 1 : bc[1] ? mp * .85 : 0.5;
                    for (var i = thm.shapesArrLen - 1; i >= 0; i--) {
                        var shi = thm.shapesArr[i],
                            _key = shi._hRatio * eh,
                            _middle = shi.children[1],
                            _shadow = shi.children[2],
                            _border = shi.children[0].children[0],
                            _glow_1 = shi.children[0].children[2].children[0];

                        //-
                        _middle.material.uniforms.u_color.value.set(sc0[0]);
                        _middle.material.uniforms.u_opacity.value = sc0[1] * mp;
                        _middle.visible = _middle._visible = (stp == 1 && sl == 3) ? true : false;

                        _shadow.material.uniforms.u_color.value.set(sc1[0]);
                        _shadow.material.uniforms.u_opacity.value = sc1[1] * sp;

                        var mhy = -((_key + 1.1) * 0.4).toFixed(2) * 1,
                            shy = eh < 1 ? -thm._df_Tdata.ry - eh : -_key - 1.1;
                        _middle.position.y = mhy;
                        _shadow.position.y = shy;

                        //-
                        _border.material.uniforms.u_width.value = -_key;
                        _border.visible = _border._visible = stp == 0 ? true : false;

                        if (_glow_1) _glow_1.position.y = .1 - _key;
                        //-
                        shi.position.y = shi._admisDic.y = shi._center.y = _key;
                        maxEH = Math.max(_key, maxEH);
                    }
                    thm.outBorderObj.children.forEach(function(node) {
                        if (node && node.children[0]) {
                            var _line1 = node.children[1],
                                _line2 = node.children[2],
                                _glow_1 = node.children[3].children[0];

                            _line1.visible = _line1._visible = (stp == 1 && sl == 3) ? true : false;
                            _line2.visible = _line2._visible = (stp == 1) ? true : false;

                            var _key = node._hRatio * eh;
                            var mhy = -((_key + 1.1) * 0.4).toFixed(2) * 1,
                                shy = eh < 1 ? -thm._df_Tdata.ry - eh : -_key - 1.1;
                            _line1.position.y = mhy + .1;
                            _line2.position.y = shy + .1;
                            _glow_1.position.y = .1 - _key;
                            node.position.y = _key;
                        }
                    });
                    thm.SVGMapLayers.position.y = thm.SVGMapLayers._py = maxEH;

                }
            },
            //- 是否悬浮
            handleSuspend: function() {
                df_Config.controls.suspend = (df_Config.controls.suspend === true);
            },
            //- 点击效果 0-无 1-单击放大  2-双击放大
            handleBMouseDown: function() {
                df_Config.controls.blockMouseDown = _Collects.limit(df_Config.controls.blockMouseDown * 1, [0, 1, 2]);
            },

            /**
             * [handleRangeParam 处理值域渲染参数 最大最小值、颜色数组]
             * @Author   ZHOUPU
             * @DateTime 2018-08-01
             * @return   {[void]}
             */
            handleRangeParam: function() {
                //- 值域渲染参数
                df_DistMap.maximum = _Collects.clamp(df_DistMap.maximum * 1, -Infinity, Infinity, 1000);
                df_DistMap.minimum = _Collects.clamp(df_DistMap.minimum * 1, -Infinity, df_DistMap.maximum - 1, 0);

                var _arr = df_DistMap.colorArray,
                    clen = Math.max(2, _arr.length),
                    rang = (df_DistMap.maximum - df_DistMap.minimum) / (clen - 1);

                df_DistMap['__worked'] = true;
                df_DistMap['__colors'] = [];
                var _l = df_DistMap.minimum;
                for (var c = 1; c < clen; c++) {
                    var ca0 = _arr[c - 1] || df_Config.sceneStyle.blockColor[0];
                    var _ci = [],
                        cArr0 = _Collects.getColorArr(ca0),
                        cArr1 = _Collects.getColorArr(_arr[c] || ca0),
                        cl0 = cArr0[0].getHSL(),
                        cl1 = cArr1[0].getHSL(),
                        color0 = new THREE.Vector3(cl0.h, cl0.s, cl0.l),
                        color1 = new THREE.Vector3(cl1.h, cl1.s, cl1.l);

                    _ci.push(_l, _l + rang);
                    _ci.push(cArr0[1], (cArr1[1] - cArr0[1]) / rang);
                    _ci.push(color0, color1.sub(color0).divideScalar(rang));
                    df_DistMap.__colors.push(_ci);
                    _l += rang;
                }
            },
            /**
             * [handleDistMap 渲染设置-条件渲染、值域渲染]
             * @Author   ZHOUPU
             * @DateTime 2018-08-02
             * @param    {[object]}   opt  [渲染参数- id:颜色/权重]
             * @return   {[void]}
             */
            handleDistMap: function(opt) {
                opt = opt || {};
                var lc = df_Config.sceneStyle.borderColor;
                for (var k in thm.SVGMapObj) {
                    delete thm.SVGMapObj[k].__color;
                    delete thm.SVGMapObj[k].__borderColor;
                    if (undefined !== opt[k]) {
                        thm.SVGMapObj[k]['color'] = opt[k][0];
                        thm.SVGMapObj[k]['__color'] = _Collects.getColorArr(opt[k][0]);

                        var _bc = (undefined != opt[k][1]) ? opt[k][1] : lc;
                        thm.SVGMapObj[k]['borderColor'] = _bc;
                        thm.SVGMapObj[k]['__borderColor'] = _Collects.getColorArr(_bc);
                        df_Clear = false;
                    }
                }
                _Collects.setBlockColor();
            },
            /**
             * [setBlockColor 设置区块- 颜色、透明度]
             * @Author   ZHOUPU
             * @DateTime 2018-08-02
             */
            setBlockColor: function() {
                var bc = df_Config.sceneStyle.blockColor,
                    stp = df_Config.controls.shadowType,
                    sl = df_Config.controls.shadowLayers,
                    sc = _Collects.getColorArr(df_Config.controls.shadowColor),
                    lc = _Collects.getColorArr(df_Config.sceneStyle.borderColor),
                    hlc = _Collects.getColorArr(df_Config.sceneStyle.highLightColor);

                var sc0 = (bc[1] && stp == 1) ? bc[1] : sc,
                    sc1 = (bc[sl - 1] && stp == 1) ? bc[sl - 1] : sc0,
                    mp = (bc[1] && stp == 1) ? 1 : 0.85,
                    sp = (bc[sl - 1] || stp == 0) ? 1 : bc[1] ? mp * .85 : 0.5;

                var _BlockTxue = df_Config.sceneStyle.blockTexture,
                    _maxXZ = Math.max(thm.mapObject._size.x, thm.mapObject._size.z),
                    _wh = new THREE.Vector2(_maxXZ, _maxXZ),
                    _off = new THREE.Vector2(thm.mapObject._offset.x, thm.mapObject._offset.z);
                for (var i = thm.shapesArrLen - 1; i >= 0; i--) {
                    var shi = thm.shapesArr[i],
                        _middle = shi.children[1],
                        _shadow = shi.children[2],
                        shiC0 = shi.children[0],
                        _border = shi.children[0].children[0],
                        _line = shi.children[0].children[1];

                    _middle.material.uniforms.u_color.value.set(sc0[0]);
                    _middle.material.uniforms.u_opacity.value = sc0[1] * mp;

                    _shadow.material.uniforms.u_color.value.set(sc1[0]);
                    _shadow.material.uniforms.u_opacity.value = sc1[1] * sp;

                    var _sj = thm.SVGMapObj[shi._path_id],
                        _bcj = _sj.__color;
                    if (_bcj && !df_Clear) {

                        shiC0.material.uniforms.u_color.value.set(_bcj[0]);
                        shiC0.material.uniforms.u_opacity.value = _bcj[1];
                        shiC0.material.uniforms.u_txue.value.dispose();
                        shiC0.material.uniforms.u_txue.value = thm._df_Tdata.txues._whitePlane;

                        shi._color = shiC0._color = _border._color = _bcj[0];
                        shi._opacity = shiC0._opacity = _border._opacity = _bcj[1];

                        _border.material.uniforms.u_color.value.set(_bcj[0]);
                        _border.material.uniforms.u_opacity.value = _bcj[1];

                        _line._color = _sj.__borderColor[0];
                        _line._opacity = _sj.__borderColor[1];
                        _line.material.uniforms.u_color.value.set(_sj.__borderColor[0]);
                        _line.material.uniforms.u_opacity.value = _sj.__borderColor[1];
                    } else {
                        //- 区块纹理
                        if (_BlockTxue) {
                            if (!_BlockTxue._isOld || df_Clear) {
                                var _white = new THREE.Color();
                                shi._color = shiC0._color = _white;
                                shiC0.material.uniforms.u_txue.value.dispose();
                                shiC0.material.uniforms.u_color.value.set(_white);
                                shiC0.material.uniforms.u_txue.value = _BlockTxue;

                                shiC0.material.uniforms.u_WH.value = _wh.clone();
                                shiC0.material.uniforms.u_offset.value = _off.clone();

                                shiC0.material.needsUpdate = true;
                            }
                        } else {
                            shiC0.material.uniforms.u_color.value.set(bc[0][0]);
                            shiC0.material.uniforms.u_txue.value.dispose();
                            shiC0.material.uniforms.u_txue.value = thm._df_Tdata.txues._whitePlane;
                            shi._color = shiC0._color = bc[0][0];
                        }
                        shiC0.material.uniforms.u_opacity.value = bc[0][1];
                        shi._opacity = shiC0._opacity = _border._opacity = bc[0][1];

                        _border._color = bc[0][0];
                        _border.material.uniforms.u_color.value.set(bc[0][0]);
                        _border.material.uniforms.u_opacity.value = bc[0][1];

                        _line._color = lc[0];
                        _line._opacity = lc[1];
                        _line.material.uniforms.u_color.value.set(lc[0]);
                        _line.material.uniforms.u_opacity.value = lc[1];
                    }
                    shi._hlColor = shiC0._hlColor = hlc[0].clone();
                    shi._hlOpacity = shiC0._hlOpacity = hlc[1];
                }
            },
            /**
             * [getDistColor 根据权重获取值域渲染颜色、透明度值]
             * @Author   ZHOUPU
             * @DateTime 2018-08-02
             * @param    {[number]}   weight [区块权重值]
             * @return   {[array]}          [包含THREE颜色对象和透明度（0-1）]
             */
            getDistColor: function(weight) {
                var _min = df_DistMap.minimum,
                    _max = df_DistMap.maximum,
                    _w = _Collects.clamp(weight * 1, _min, _max, _min);

                var _colorArr = df_DistMap.__colors,
                    _cArr = [];
                for (var i = 0, al = _colorArr.length; i < al; i++) {
                    var _ci = _colorArr[i];
                    var _cimax = (i == al - 1) ? _max : _ci[1];
                    if (_w >= _ci[0] && _w <= _cimax) {
                        var _v = _ci[4].clone().add(_ci[5].clone().multiplyScalar(_w - _ci[0])),
                            _c = _Collects.color().setHSL(_v.x, _v.y, _v.z);
                        _cArr.push(_c, _ci[2] + _ci[3] * (_w - _ci[0]));
                    }
                }
                return _cArr;
            },

            //- creatMapMesh
            /**
             * [getBevelVec 根据三个连续点获取点的斜角参数]
             * @Author   ZHOUPU
             * @DateTime 2018-08-02
             * @param    {[object]}   inPt   [当前点- vector3对象]
             * @param    {[object]}   inPrev [前一个点- vector3对象]
             * @param    {[object]}   inNext [后一个点- vector3对象]
             * @return   {[object]}          [斜角参数- vector2对象]
             */
            getBevelVec: function(inPt, inPrev, inNext) {
                var v_trans_x, v_trans_y, shrink_by = 1;

                var v_prev_x = inPt.x - inPrev.x,
                    v_prev_y = inPt.y - inPrev.y,
                    v_next_x = inNext.x - inPt.x,
                    v_next_y = inNext.y - inPt.y,
                    v_prev_lensq = (v_prev_x * v_prev_x + v_prev_y * v_prev_y),
                    collinear0 = (v_prev_x * v_next_y - v_prev_y * v_next_x);

                if (Math.abs(collinear0) > Number.EPSILON) {
                    var v_prev_len = Math.sqrt(v_prev_lensq);
                    var v_next_len = Math.sqrt(v_next_x * v_next_x + v_next_y * v_next_y);

                    var ptPrevShift_x = (inPrev.x - v_prev_y / v_prev_len),
                        ptPrevShift_y = (inPrev.y + v_prev_x / v_prev_len),
                        ptNextShift_x = (inNext.x - v_next_y / v_next_len),
                        ptNextShift_y = (inNext.y + v_next_x / v_next_len);

                    var sf = ((ptNextShift_x - ptPrevShift_x) * v_next_y -
                        (ptNextShift_y - ptPrevShift_y) * v_next_x) / (v_prev_x * v_next_y - v_prev_y * v_next_x);

                    v_trans_x = (ptPrevShift_x + v_prev_x * sf - inPt.x);
                    v_trans_y = (ptPrevShift_y + v_prev_y * sf - inPt.y);

                    var v_trans_lensq = (v_trans_x * v_trans_x + v_trans_y * v_trans_y);

                    if (v_trans_lensq <= 2) {
                        return new THREE.Vector2(v_trans_x, v_trans_y);
                    } else {
                        shrink_by = Math.sqrt(v_trans_lensq / 2);
                    }

                } else {

                    var direction_eq = false;
                    if (v_prev_x > Number.EPSILON) {
                        if (v_next_x > Number.EPSILON) direction_eq = true;
                    } else {
                        if (v_prev_x < -Number.EPSILON) {
                            if (v_next_x < -Number.EPSILON) direction_eq = true;
                        } else {
                            if (Math.sign(v_prev_y) === Math.sign(v_next_y)) direction_eq = true;
                        }
                    }

                    if (direction_eq) {
                        v_trans_x = -v_prev_y;
                        v_trans_y = v_prev_x;
                        shrink_by = Math.sqrt(v_prev_lensq);
                    } else {
                        v_trans_x = v_prev_x;
                        v_trans_y = v_prev_y;
                        shrink_by = Math.sqrt(v_prev_lensq / 2);
                    }
                }

                return new THREE.Vector2(v_trans_x / shrink_by, v_trans_y / shrink_by);
            },

            /**
             * [creatCommonGeo 创建通用 Geometry]
             * @Author   ZHOUPU
             * @DateTime 2018-08-29
             * @param    {[object]}   shapes [SVG解析后的形状对象]
             * @param    {[array]}   fxy    [偏移数组]
             * @param    {[object]}   opts   [参数对象]
             * @return   {[object]}          [geo对象]
             */
            creatCommonGeo: function(shapes, fxy, opts) {
                var len = Math.floor(shapes.getLength() / opts.seg),
                    vertices = shapes.getSpacedPoints(Math.max(3, len));

                //- 处理孔洞
                var holesPts = [];
                for (var i = 0, hl = shapes.holes.length; i < hl; i++) {
                    var hole = shapes.holes[i];
                    var ahole = hole.getSpacedPoints(Math.max(3, Math.floor(hole.getLength() / opts.seg)));
                    _Collects.holeReverse(ahole);
                    holesPts[i] = ahole;
                }
                _Collects.reverse(vertices);

                //- 构造面
                var faces = _Collects.tgShape(vertices, holesPts);
                var fx = _Collects.clamp(fxy[0] * 1, -Infinity, Infinity, 0),
                    fy = _Collects.clamp(fxy[1] * 1, -Infinity, Infinity, 0);

                var bgeo = _Geometries.buf(), //边框
                    sgeo = _Geometries.buf(), //区块

                    gGeo1 = _Geometries.geo(), //外发光
                    gGeo2 = _Geometries.buf(); //发光点

                //- buffer数组
                var b_uvs = [],
                    b_ratios = [],
                    b_indices = [],
                    b_positions = [],
                    b_positions2 = [],

                    s_Id = [],
                    s_uvs = [],
                    s_indices = [],
                    s_vertices = [],

                    p_pid = [],
                    p_position = [];

                //- 外圈 & 计算斜角参数
                var vl = vertices.length,
                    seg = vl < 100 ? Math.max(50, Math.floor(vl / 2)) : 100,
                    pid = Math.floor(seg * .16),
                    p_id = 1;
                for (var i = 0, j = vl - 1, k = i + 1; i < vl; i++, j++, k++) {
                    if (j === vl) j = 0;
                    if (k === vl) k = 0;
                    var ci = vertices[i],
                        cix = ci.x + fx,
                        ciy = ci.y + fy,
                        cj = vertices[j],
                        ck = vertices[k],
                        bv = _Collects.getBevelVec(ci, cj, ck);

                    b_ratios.push(-1, 1);
                    b_uvs.push(i / vl, 1, i / vl, 0);
                    b_positions.push(cix, 0, ciy, cix, 0, ciy);
                    b_positions2.push(bv.x, 0, bv.y, bv.x, 0, bv.y);

                    s_Id.push(opts.id);
                    s_uvs.push(cix, ciy);
                    s_vertices.push(cix, 0, ciy);

                    //-
                    if (i % 2 == 1) gGeo1.vertices.push(new THREE.Vector3(cix, 0, ciy));
                    if (i % seg == pid) {
                        p_pid.push(p_id);
                        p_position.push(cix, 0, ciy);
                        p_id++;
                    }

                    if (i < vl - 1) {
                        var a = i * 2,
                            b = i * 2 + 1,
                            c = i * 2 + 2,
                            d = i * 2 + 3;
                        b_indices.push(a, b, c, b, d, c);
                    }
                    if (i == vl - 1) {
                        b_indices.push(i * 2, i * 2 + 1, 0, i * 2 + 1, 1, 0);
                    }
                }

                //- 孔洞 & 计算斜角参数
                var _ofd = vl;
                for (var h = 0, hl = holesPts.length; h < hl; h++) {
                    var contour = holesPts[h],
                        cl = contour.length;
                    for (var i = 0, j = cl - 1, k = i + 1; i < cl; i++, j++, k++) {
                        if (j === cl) j = 0;
                        if (k === cl) k = 0;
                        var ci = contour[i],
                            cix = ci.x + fx,
                            ciy = ci.y + fy,
                            cj = contour[j],
                            ck = contour[k],
                            bv = _Collects.getBevelVec(ci, cj, ck);

                        b_ratios.push(-1, 1);
                        b_uvs.push(i / cl, 1, i / cl, 0);
                        b_positions.push(cix, 0, ciy, cix, 0, ciy);
                        b_positions2.push(bv.x, 0, bv.y, bv.x, 0, bv.y);

                        s_Id.push(opts.id);
                        s_uvs.push(cix, ciy);
                        s_vertices.push(cix, 0, ciy);

                        //-
                        if (i % 2 == 1) gGeo1.vertices.push(new THREE.Vector3(cix, 0, ciy));
                        if (i % seg == pid) {
                            p_pid.push(p_id);
                            p_position.push(cix, 0, ciy);
                            p_id++;
                        }

                        var _m = i + _ofd;
                        if (i < cl - 1) {
                            var a = _m * 2,
                                b = _m * 2 + 1,
                                c = _m * 2 + 2,
                                d = _m * 2 + 3;
                            b_indices.push(a, b, c, b, d, c);
                        }
                        if (i == cl - 1) {
                            b_indices.push(_m * 2, _m * 2 + 1, _ofd * 2, _m * 2 + 1, _ofd * 2 + 1, _ofd * 2);
                        }
                    }
                    _ofd += cl;
                }

                //-
                bgeo.setIndex(b_indices);
                bgeo.addAttribute('uv', new THREE.Float32BufferAttribute(b_uvs, 2));
                bgeo.addAttribute('cRatio', new THREE.Float32BufferAttribute(b_ratios, 1));
                bgeo.addAttribute('position', new THREE.Float32BufferAttribute(b_positions, 3));
                bgeo.addAttribute('cPosition', new THREE.Float32BufferAttribute(b_positions2, 3));

                for (var i = 0, _fl = faces.length; i < _fl; i++) {
                    var face = faces[i];
                    s_indices.push(face[0], face[1], face[2]);
                }
                sgeo.setIndex(s_indices);
                sgeo.addAttribute('cId', new THREE.Float32BufferAttribute(s_Id, 1));
                sgeo.addAttribute('uv', new THREE.Float32BufferAttribute(s_uvs, 2));
                sgeo.addAttribute('position', new THREE.Float32BufferAttribute(s_vertices, 3));

                gGeo2.addAttribute('pId', new THREE.Float32BufferAttribute(p_pid, 1));
                gGeo2.addAttribute('position', new THREE.Float32BufferAttribute(p_position, 3));

                return {
                    bgeo: bgeo,
                    sgeo: sgeo,
                    gGeoArr: [gGeo1, gGeo2],
                }
            },

            /**
             * [creatOuterGlow 创建外发光&光点对象]
             * @Author   ZHOUPU
             * @DateTime 2018-08-02
             * @param    {[array]}   gGeoArr [点几何体数组]
             * @param    {[object]}   opts   [参数对象- 大小、颜色、透明度]
             * @param    {[number]}   eh     [投影高度参数]
             * @param    {[number]}   hr     [区块高度参数]
             * @return   {[object]}          [外发光&光点的object3D对象]
             */
            creatOuterGlow: function(gGeoArr, opts, eh, hr) {
                var optk = .1 + .2 * (5 - opts.gs) / 4;

                //- 外发光
                var gSize = (200 + 80 * opts.gs);
                var _glow_1 = new THREE.Points(gGeoArr[0], _Materials.point({
                    color: opts.gc[0],
                    opacity: opts.gc[1] * optk,
                    size: gSize,
                    depthWrite: false,
                    transparent: true,
                    map: thm._df_Tdata.txues._spot,
                    blending: opts.gbld ? THREE.AdditiveBlending : THREE.NormalBlending,
                }));
                _glow_1.position.y = _glow_1._phy = .1 - eh * hr * opts.gp;
                _glow_1.visible = _glow_1._visible = opts.gsw;

                _glow_1._type = 1;
                _glow_1._size = gSize;
                _glow_1._color = opts.gc[0];
                _glow_1._opacity = opts.gc[1] * optk;

                //- 光点
                var _glow_2 = new THREE.Points(gGeoArr[1], _Materials.shader({
                    uniforms: {
                        u_color: {
                            value: opts.pc[0].clone()
                        },
                        u_opacity: {
                            value: opts.pc[1]
                        },
                        u_pd: {
                            value: 6 - opts.pd //光点密度
                        },
                        u_size: {
                            value: (200 + 170 * opts.ps) * df_Height * 0.5
                        },
                        u_txue: {
                            value: opts.ptxue
                        }
                    },
                    depthTest: false,
                    transparent: true,
                    vertexShader: _Shaders.PointVShader,
                    fragmentShader: _Shaders.PointFShader,
                }));

                _glow_2.position.y = _glow_2._phy = .1;
                _glow_2.visible = _glow_2._visible = opts.psw;

                _glow_2._type = 2;
                _glow_2._color = opts.pc[0];
                _glow_2._opacity = opts.pc[1];

                //-
                _glow_2._flicker = true;
                _glow_2._transTimes = 0;
                _glow_2._perTimes = opts.pt;
                _glow_2._ratio = Math.random();

                df_animationArr.push(_glow_2);

                _glow_1._hRatio = _glow_2._hRatio = hr;
                _glow_1._isGlow = _glow_2._isGlow = true;
                return _Collects.obj().add(_glow_1, _glow_2);
            },
            /**
             * [creatSVGLine 创建区块边线]
             * @Author   ZHOUPU
             * @DateTime 2018-08-02
             * @param    {[array]}   contour [点数组]
             * @param    {[array]}   cArr    [颜色数组- 颜色、透明度]
             * @param    {[number]}   w       [边线的宽度]
             * @param    {[number]}   hr      [区块高度参数]
             * @param    {[number]}   hy      [边线高度]
             * @param    {[number]}   type     [边线类型]
             * @param    {[array]}   lhc     [边线高亮 颜色数组- 颜色、透明度]
             * @return   {[object]}           [边线THREE对象]
             */
            creatSVGLine: function(lGeo, cArr, w, hr, hy, type, lhc) {
                type = type || 0.1;
                var lMtl = _Materials.shader({
                    uniforms: {
                        u_color: {
                            value: cArr[0].clone()
                        },
                        u_opacity: {
                            value: cArr[1]
                        },
                        u_width: {
                            value: (type == 3) ? w : -w
                        },
                        u_type: {
                            value: (type == 3) ? 1 : type
                        }
                    },
                    transparent: true,
                    side: THREE.DoubleSide,
                    depthWrite: false,
                    vertexShader: _Shaders.SplineVShader,
                    fragmentShader: _Shaders.ShadowFShader,
                });
                var _line = new THREE.Mesh(lGeo, lMtl);

                _line.position.y = hy;

                _line._isLine = true;
                _line._hRatio = hr;
                _line._color = cArr[0].clone();
                _line._opacity = cArr[1];

                if (lhc) {
                    _line._hlColor = lhc[0].clone();
                    _line._hlOpacity = lhc[1];
                }

                return _line;
            },
            /**
             * [creatBorder 创建区块边框]
             * @Author   ZHOUPU
             * @DateTime 2018-08-02
             * @param    {[array]}   contour [点数组]
             * @param    {[array]}   cArr    [颜色数组- 颜色、透明度]
             * @param    {[number]}   eh      [投影高度参数]
             * @param    {[number]}   hr      [区块高度参数]
             * @param    {[array]}   fxy     [区块偏移参数]
             * @return   {[object]}           [区块边框对象]
             */
            creatBorder: function(bGeo, cArr, eh, hr, type) {
                type = type || 0.1;
                var bMtl = _Materials.shader({
                    uniforms: {
                        u_color: {
                            value: cArr[0].clone()
                        },
                        u_opacity: {
                            value: cArr[1]
                        },
                        u_width: {
                            value: -eh * hr
                        },
                        u_txue: {
                            value: thm._df_Tdata.txues._border
                        },
                        u_type: {
                            value: type
                        }
                    },
                    transparent: true,
                    side: THREE.DoubleSide,
                    depthWrite: false,
                    vertexShader: _Shaders.SplineVShader,
                    fragmentShader: _Shaders.BorderFShader,
                });
                var bMesh = new THREE.Mesh(bGeo, bMtl);

                bMesh._isBorder = true;
                bMesh._hRatio = hr;
                bMesh._color = cArr[0];
                bMesh._opacity = cArr[1];
                return bMesh;
            },
            /**
             * [creatShape 创建区块对象]
             * @Author   ZHOUPU
             * @DateTime 2018-08-02
             * @param    {[object]}   shapGeo [区块geometry]
             * @param    {[object]}   opts    [参数对象- 颜色、透明度、高亮颜色、高亮透明度]
             * @param    {[number]}   hy      [y轴位置]
             * @param    {[number]}   hr      [区块高度参数]
             * @return   {[object]}           [区块对象]
             */
            creatShape: function(shapGeo, opts, hy, hr, islable) {
                var _shape;
                if (islable) { //点击触发区块
                    if (!df_shapeLable) {
                        df_shapeLable = _Materials.lambert({
                            opacity: 0,
                            transparent: true,
                            side: THREE.BackSide,
                            depthWrite: false,
                        });
                    }
                    _shape = new THREE.Mesh(shapGeo, df_shapeLable);
                    _shape._isshapeLable = true;
                } else { //区块
                    _shape = new THREE.Mesh(shapGeo, _Materials.shader({
                        uniforms: {
                            u_color: {
                                value: opts.bc[0].clone()
                            },
                            u_opacity: {
                                value: opts.bc[1]
                            },
                            u_offset: {
                                value: new THREE.Vector2(0, 0)
                            },
                            u_WH: {
                                value: new THREE.Vector2(1, 1)
                            },
                            u_txue: {
                                value: thm._df_Tdata.txues._whitePlane
                            },
                        },
                        transparent: true,
                        side: THREE.BackSide,
                        vertexShader: _Shaders.ShapeVShader,
                        fragmentShader: _Shaders.BorderFShader,
                    }));
                }
                _shape.position.y = hy;
                _shape._positionY = hy;

                _shape._isShape = true;
                _shape._hRatio = hr;
                _shape._color = opts.bc[0];
                _shape._opacity = opts.bc[1];
                _shape._hlColor = opts.hlc[0];
                _shape._hlOpacity = opts.hlc[1];

                return _shape;
            },
            /**
             * [creatShadow 创建投影对象]
             * @Author   ZHOUPU
             * @DateTime 2018-08-02
             * @param    {[object]}   geo  [投影的几何体结构对象]
             * @param    {[array]}   cArr [包含颜色和透明度的数组]
             * @param    {[number]}   msp  [透明度参数]
             * @param    {[boolean]}   sdw  [是否投影]
             * @param    {[number]}   hy   [投影位置系数]
             * @param    {[boolean]}   type   [true-中间层，false-最下层]
             * @return   {[object]}        [投影对象]
             */
            creatShadow: function(geo, cArr, msp, hy, type) {
                var _shadow;
                if (!!type) {
                    if (!df_middleMtl) {
                        df_middleMtl = _Materials.shader({
                            uniforms: {
                                u_color: {
                                    value: cArr[0].clone()
                                },
                                u_opacity: {
                                    value: cArr[1] * msp
                                },
                                u_showGId: {
                                    value: new THREE.Vector4(-1, -1, -1, -1)
                                },
                            },
                            depthWrite: false,
                            transparent: true,
                            side: THREE.DoubleSide,
                            vertexShader: _Shaders.ShadowVShader,
                            fragmentShader: _Shaders.ShadowFShader,
                        });
                    }
                    _shadow = new THREE.Mesh(geo, df_middleMtl);
                    _shadow._isMiddle = true;
                } else {
                    if (!df_shadowMtl) {
                        df_shadowMtl = _Materials.shader({
                            uniforms: {
                                u_color: {
                                    value: cArr[0].clone()
                                },
                                u_opacity: {
                                    value: cArr[1] * msp
                                },
                                u_showGId: {
                                    value: new THREE.Vector4(-1, -1, -1, -1)
                                },
                            },
                            depthWrite: false,
                            transparent: true,
                            side: THREE.DoubleSide,
                            vertexShader: _Shaders.ShadowVShader,
                            fragmentShader: _Shaders.ShadowFShader,
                        });
                    }
                    _shadow = new THREE.Mesh(geo, df_shadowMtl);
                    _shadow._isShadow = true;
                }
                _shadow.position.y = hy;

                _shadow._color = cArr[0];
                _shadow._opacity = cArr[1] * msp;

                return _shadow;
            },
            /**
             * [creatTagsTxue 创建文字图片对象]
             * @Author   ZHOUPU
             * @DateTime 2018-08-02
             * @param    {[string]}   text [文字内容]
             * @return   {[object]}        [文字图片对象]
             */
            creatTagsTxue: function(text) {
                var t = text || "",
                    cvs1, cvs2, ctx1, ctx2, _w = 2;
                cvs1 = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
                cvs2 = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
                ctx1 = cvs1.getContext("2d");
                ctx2 = cvs2.getContext("2d");
                cvs1.width = cvs1.height = _w;
                cvs2.width = cvs2.height = _w;

                if ( t.length ) {
                    ctx1.font = "bold 36px Arial";
                    var _tw = ctx1.measureText(t).width + 2;
                    _w = Math.max(64, THREE.Math.nextPowerOfTwo(_tw));
                    cvs1.width = cvs1.height = _w;
                    cvs2.width = cvs2.height = _w;

                    //-
                    ctx1.font = "normal 36px Arial";
                    ctx1.textAlign = "center";
                    ctx1.textBaseline = "middle";

                    ctx1.shadowBlur = 1;
                    ctx1.shadowColor = "#EEE";

                    ctx1.fillStyle = "#FFF";
                    ctx1.fillText(t, _w / 2, _w / 2);

                    //-
                    ctx2.font = "bold 36px Arial";
                    ctx2.textAlign = "center";
                    ctx2.textBaseline = "middle";

                    ctx2.shadowBlur = 1;
                    ctx2.shadowColor = "#EEE";

                    ctx2.fillStyle = "#FFF";
                    ctx2.fillText(t, _w / 2, _w / 2);
                }

                var texture1 = new THREE.Texture(cvs1);
                texture1.needsUpdate = true;
                texture1._scale = _w / 16;
                cvs1 = null;

                var texture2 = new THREE.Texture(cvs2);
                texture2.needsUpdate = true;
                texture2._scale = _w / 16;
                cvs2 = null;

                return {
                    1: texture1,
                    2: texture2
                };
            },
            /**
             * [creatTags 创建标签对象]
             * @Author   ZHOUPU
             * @DateTime 2018-08-02
             * @param    {[object]}   txue [文字图片对象]
             * @param    {[object]}   opts [标签配置参数- 颜色、大小、粗细等]
             * @param    {[object]}   vec  [坐标位置对象]
             * @param    {[number]}   offx [横向偏移系数，右为正]
             * @param    {[number]}   offy [竖向偏移系数，下为正]
             * @return   {[object]}        [标签文字对象]
             */
            creatTags: function(txue, opts, vec, offx, offy) {

                var _t = txue[opts.fw],
                    _s = _t._scale * opts.fs * (22 - opts.fs) * .18;
                var tGeo = _Geometries.geo();
                tGeo.vertices.push(vec.clone().add(new THREE.Vector3(offx, 0, offy)));
                var _tags = new THREE.Points(tGeo, _Materials.point({
                    size: _s,
                    color: opts.fc[0],
                    opacity: opts.fc[1],
                    map: _t,
                    transparent: true,
                    depthWrite: false,
                    sizeAttenuation: false,
                }));
                _tags.position.y = opts.fs * (22 - opts.fs) * .18;
                _tags.visible = opts.st;
                _tags._visible = opts.st;

                _tags._vec = vec.clone();

                _tags._isTags = true;
                _tags._color = opts.fc[0];
                _tags._opacity = opts.fc[1];
                _tags._hlColor = opts.fh[0];
                _tags._hlOpacity = opts.fh[1];
                _tags._txueArr = txue;

                return _tags;
            },

            //- analysis svg path
            /**
             *[transformSVGPath 解析SVG path为THREE形状]
             * @Author   ZHOUPU
             * @DateTime 2018-08-02
             * @param    {[string]}   pathStr [svg path字符串]
             * @param    {[boolean]}   fillStyle [填充方式, true-内部孔洞 false-外部区块]
             * @return   {[object]}           [THREE形状对象]
             */
            transformSVGPath: function(pathStr, fillStyle) {
                var paths = [];
                var path = new THREE.ShapePath();
                fillStyle = (fillStyle === true);

                pathStr = pathStr.replace(/\s/g, ' ');

                var DEGS_TO_RADS = Math.PI / 180,
                    PERIOD = 46, //.
                    MINUS = 45, //-
                    DIGIT_0 = 48,
                    DIGIT_9 = 57,
                    COMMA = 44, //,
                    SPACE = 32; //SPACE

                var idx = 1,
                    len = pathStr.length,
                    activeCmd,
                    x = 0,
                    y = 0,
                    nx = 0,
                    ny = 0,
                    cx, cy, firstX = null,
                    firstY = null,
                    x1 = null,
                    y1 = null,
                    x2 = null,
                    y2 = null,
                    rx = 0,
                    ry = 0,
                    xar = 0,
                    laf = 0,
                    sf = 0;
                //获取数值字符
                function eatNum() {
                    var sidx, c, isFloat = false,
                        s, k = 0;
                    while (idx < len) {
                        c = pathStr.charCodeAt(idx);
                        if (c !== COMMA && c !== SPACE) {
                            break;
                        }
                        idx++;
                    }
                    if (c === MINUS) {
                        sidx = idx++;
                    } else {
                        sidx = idx;
                    }

                    while (idx < len) {
                        c = pathStr.charCodeAt(idx);
                        if (DIGIT_0 <= c && c <= DIGIT_9) {
                            idx++;
                            continue;
                        } else if (c === PERIOD && k < 1) {
                            idx++;
                            k++;
                            isFloat = true;
                            continue;
                        }
                        s = pathStr.substring(sidx, idx);
                        s = isFloat ? parseFloat(s) : parseInt(s);
                        if (isNaN(s)) {
                            idx++;
                            sidx = idx;
                        } else {
                            return s;
                        }
                    }

                    s = pathStr.substring(sidx);
                    return isFloat ? parseFloat(s) : parseInt(s);
                }
                //下一个path指令
                function nextIsNum() {
                    var c;
                    while (idx < len) {
                        c = pathStr.charCodeAt(idx);
                        if (c !== COMMA && c !== SPACE) {
                            break;
                        }
                        idx++;
                    }
                    c = pathStr.charCodeAt(idx);
                    return (c === PERIOD || c === MINUS || (DIGIT_0 <= c && c <= DIGIT_9));
                }

                var canRepeat;
                var enteredSub = false;
                var zSeen = false;
                activeCmd = pathStr[0];

                while (idx <= len) {
                    canRepeat = true;
                    switch (activeCmd) {
                        case 'M':
                            enteredSub = false;
                            x = eatNum();
                            y = eatNum();
                            path.moveTo(x, y);
                            activeCmd = 'L';
                            break;
                        case 'm':
                            enteredSub = false;
                            x += eatNum();
                            y += eatNum();
                            path.moveTo(x, y);
                            activeCmd = 'l';
                            break;
                        case 'Z':
                        case 'z':
                            canRepeat = false;
                            if (x !== firstX || y !== firstY) {
                                x = firstX;
                                y = firstY;
                                path.lineTo(firstX, firstY);
                            }
                            firstX = null;
                            firstY = null;
                            enteredSub = true;
                            if (!fillStyle) {
                                paths.push(path);
                                path = new THREE.ShapePath();
                                zSeen = true;
                            }
                            break;
                        case 'L':
                        case 'H':
                        case 'V':
                            nx = (activeCmd === 'V') ? x : eatNum();
                            ny = (activeCmd === 'H') ? y : eatNum();
                            path.lineTo(nx, ny);
                            x = nx;
                            y = ny;
                            break;
                        case 'l':
                        case 'h':
                        case 'v':
                            nx = (activeCmd === 'v') ? x : (x + eatNum());
                            ny = (activeCmd === 'h') ? y : (y + eatNum());
                            path.lineTo(nx, ny);
                            x = nx;
                            y = ny;
                            break;
                        case 'C':
                            x1 = eatNum();
                            y1 = eatNum();
                        case 'S':
                            if (activeCmd === 'S') {
                                x1 = (x2 === null) ? x : 2 * x - x2;
                                y1 = (y2 === null) ? y : 2 * y - y2;
                            }
                            x2 = eatNum();
                            y2 = eatNum();
                            nx = eatNum();
                            ny = eatNum();
                            path.bezierCurveTo(x1, y1, x2, y2, nx, ny);
                            x = nx;
                            y = ny;
                            break;
                        case 'c':
                            x1 = x + eatNum();
                            y1 = y + eatNum();
                        case 's':
                            if (activeCmd === 's') {
                                x1 = (x2 === null) ? x : 2 * x - x2;
                                y1 = (y2 === null) ? y : 2 * y - y2;
                            }
                            x2 = x + eatNum();
                            y2 = y + eatNum();
                            nx = x + eatNum();
                            ny = y + eatNum();
                            path.bezierCurveTo(x1, y1, x2, y2, nx, ny);
                            x = nx;
                            y = ny;
                            break;
                        case 'Q':
                            x1 = eatNum();
                            y1 = eatNum();
                        case 'T':
                            if (activeCmd === 'T') {
                                x1 = (x1 === null) ? x : 2 * x - x1;
                                y1 = (y1 === null) ? y : 2 * y - y1;
                            }
                            nx = eatNum();
                            ny = eatNum();
                            path.quadraticCurveTo(x1, y1, nx, ny);
                            x = nx;
                            y = ny;
                            break;
                        case 'q':
                            x1 = x + eatNum();
                            y1 = y + eatNum();
                        case 't':
                            if (activeCmd === 't') {
                                x1 = (x1 === null) ? x : 2 * x - x1;
                                y1 = (y1 === null) ? y : 2 * y - y1;
                            }
                            nx = x + eatNum();
                            ny = y + eatNum();
                            path.quadraticCurveTo(x1, y1, nx, ny);
                            x = nx;
                            y = ny;
                            break;
                        case 'A':
                        case 'a':
                            rx = eatNum();
                            ry = eatNum();
                            xar = eatNum() * DEGS_TO_RADS;
                            laf = eatNum();
                            sf = eatNum();
                            nx = (activeCmd === 'a') ? x + eatNum() : eatNum();
                            ny = (activeCmd === 'a') ? y + eatNum() : eatNum();

                            //-
                            x1 = Math.cos(xar) * (x - nx) / 2 + Math.sin(xar) * (y - ny) / 2;
                            y1 = -Math.sin(xar) * (x - nx) / 2 + Math.cos(xar) * (y - ny) / 2;

                            var norm = Math.sqrt(Math.max(0, (rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1)) / (rx * rx * y1 * y1 + ry * ry * x1 * x1));
                            if (laf === sf) {
                                norm = -norm;
                            }
                            x2 = norm * rx * y1 / ry;
                            y2 = norm * -ry * x1 / rx;

                            cx = Math.cos(xar) * x2 - Math.sin(xar) * y2 + (x + nx) / 2;
                            cy = Math.sin(xar) * x2 + Math.cos(xar) * y2 + (y + ny) / 2;

                            //-
                            var u = new THREE.Vector2(1, 0),
                                v = new THREE.Vector2((x1 - x2) / rx, (y1 - y2) / ry);
                            var startAng = Math.acos(u.dot(v) / u.length() / v.length());
                            if (u.x * v.y - u.y * v.x < 0) {
                                startAng = -startAng;
                            }

                            u.x = (-x1 - x2) / rx;
                            u.y = (-y1 - y2) / ry;

                            //-
                            var deltaAng = Math.acos(v.dot(u) / v.length() / u.length());
                            if (v.x * u.y - v.y * u.x < 0) {
                                deltaAng = -deltaAng;
                            }
                            if (!sf && deltaAng > 0) {
                                deltaAng -= Math.PI * 2;
                            }
                            if (sf && deltaAng < 0) {
                                deltaAng += Math.PI * 2;
                            }

                            //-
                            var cw = (sf === 1) ? false : true;
                            path.currentPath.absellipse(cx, cy, rx, ry, startAng, startAng + deltaAng, cw);
                            x = nx;
                            y = ny;
                            x1 = null;
                            y1 = null;
                            x2 = null;
                            y2 = null;
                            break;
                        case ' ':
                            break;
                        default:
                            throw new Error("weird path command: " + activeCmd);
                    }
                    if (firstX === null && !enteredSub) {
                        firstX = x;
                        firstY = y;
                    }
                    if (canRepeat && nextIsNum()) {
                        continue;
                    }
                    activeCmd = pathStr[idx++];
                }

                if (zSeen) {
                    return paths;
                } else {
                    paths.push(path);
                    return paths;
                }
            },

            //- analysis color
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

            //- mouseEvent
            /**
             * [mouseMoveIn 鼠标移入执行的方法]
             * @Author   ZHOUPU
             * @DateTime 2018-08-02
             * @param    {[object]}   node [移入事件的节点]
             * @return   {[void]}
             */
            mouseMoveIn: function(node) {
                if (df_Config.controls.suspend) {
                    if (thm.SVGMapLayers) {
                        thm.SVGMapLayers.traverse(function(child) {
                            if (!child._isBackLabels && child._isLabels && child._name == node._name) {
                                child.position.y = child._positionY + thm._df_Tdata.py;
                            }
                            if (!child._isMigMapBackLabels && child._isMigLines && child._name == node._name) {
                                child.position.y = child._positionY + thm._df_Tdata.py;
                            }
                        });
                        //by lilingling on time 2019/7/30 添加：区块上浮处理
                        thm.columnarMap._setToRise(true,node._name);
                    }
                }
                for (var j = thm.shapesArrLen - 1; j >= 0; j--) {
                    var shpic = thm.shapesArr[j].children[0];
                    if (node._path_id == shpic._path_id) {
                        if (df_Config.controls.suspend) shpic.position.y = shpic._positionY + thm._df_Tdata.py;
                        if (!df_Config.sceneStyle.isHighlight) continue;

                        shpic.material.uniforms.u_color.value.set(shpic._hlColor);
                        shpic.material.uniforms.u_opacity.value = shpic._hlOpacity;

                        shpic.children[0].material.blending = THREE.AdditiveBlending;
                        shpic.children[0].material.uniforms.u_color.value.set(shpic._hlColor);
                        shpic.children[0].material.uniforms.u_opacity.value = shpic._hlOpacity;

                        shpic.children[1].material.uniforms.u_color.value.set(shpic.children[1]._hlColor);
                        shpic.children[1].material.uniforms.u_opacity.value = shpic.children[1]._hlOpacity;

                        shpic.children[2].traverse(function(child) {
                            if (child._isGlow) {
                                if (child._type == 1) {
                                    child.material.depthTest = false;
                                }
                                child.position.y = thm._df_Tdata.ry;
                            }
                        });

                        shpic.children[3].material.color.set(shpic.children[3]._hlColor);
                        shpic.children[3].material.opacity = shpic.children[3]._hlOpacity;
                    }
                }
            },
            /**
             * [mouseMoveOut 鼠标移除执行的方法]
             * @Author   ZHOUPU
             * @DateTime 2018-08-02
             * @param    {[object]}   node [移除事件的节点]
             * @return   {[void]}
             */
            mouseMoveOut: function(node) {

                if (node._selected) return;

                if (df_Config.controls.suspend) {
                    if (thm.SVGMapLayers) {
                        thm.SVGMapLayers.traverse(function(child) {
                            if (!child._isBackLabels && child._isLabels && child._name == node._name) {
                                child.position.y = child._positionY;
                            }
                            if (!child._isMigMapBackLabels && child._isMigLines && child._name == node._name) {
                                child.position.y = child._positionY;
                            }
                        });
                        //by lilingling on time 2019/7/30 添加：区块还原处理
                        thm.columnarMap._setToRise(false,node._name);
                    }
                }

                for (var j = thm.shapesArrLen - 1; j >= 0; j--) {
                    var shpic = thm.shapesArr[j].children[0];
                    if (node._path_id == shpic._path_id) {
                        if (df_Config.controls.suspend) shpic.position.y = shpic._positionY;

                        shpic.material.uniforms.u_color.value.set(shpic._color);
                        shpic.material.uniforms.u_opacity.value = shpic._opacity;

                        shpic.children[0].material.blending = THREE.NormalBlending;
                        shpic.children[0].material.uniforms.u_color.value.set(shpic.children[0]._color);
                        shpic.children[0].material.uniforms.u_opacity.value = shpic.children[0]._opacity;

                        shpic.children[1].material.uniforms.u_color.value.set(shpic.children[1]._color);
                        shpic.children[1].material.uniforms.u_opacity.value = shpic.children[1]._opacity;

                        shpic.children[2].traverse(function(child) {
                            if (child._isGlow) {
                                if (child._type == 1) {
                                    child.material.depthTest = true;
                                }
                                child.position.y = child._phy;
                            }
                        });

                        shpic.children[3].material.color.set(shpic.children[3]._color);
                        shpic.children[3].material.opacity = shpic.children[3]._opacity;
                    }
                }
            },

            //- loadTexture
            /**
             * [loadTexture 加载图片- 预先加载所有需要用到的图片]
             * @Author   ZHOUPU
             * @DateTime 2018-08-02
             * @return   {[void]}
             */
            loadTexture: function() {
                var _n = df_Config.texture;
                thm._TxueLoader = new THREE.TextureLoader();

                thm._df_Tdata.txues._spot = _Collects.creatSpotTexture();
                thm._df_Tdata.txues._border = _Collects.creatBorderTexture();
                for (var k in _n) {
                    thm._df_Tdata.txues['_' + k] = thm._TxueLoader.load(_n[k]);
                }
                thm._df_Tdata.txues._whitePlane = _Collects.creatPlaneTexture();
                thm._df_Tdata.txues._flashRings = _Collects.creatRingsTexture();
            },
            /**
             * [creatSpotTexture 创建canvas点图片]
             * @Author   ZHOUPU
             * @DateTime 2018-08-02
             * @param    {[number]}   size  [图片大小参数]
             * @param    {[number]}   power [径向渐变参数]
             * @return   {[object]}         [THREE图片对象]
             */
            creatSpotTexture: function(size, power) {
                var s = size * 16 || 128,
                    m = power || 2,
                    cvs = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas'),
                    ctx = cvs.getContext("2d");
                cvs.width = s;
                cvs.height = s;
                var i, l = 8,
                    c = 255,
                    p = s / 2,
                    r = s / 2,
                    grad = ctx.createRadialGradient(p, p, 0, p, p, r),
                    Cubic = function(k, n) {
                        if (n === 2) return k * k;
                        if (n === 3) return k * k * k;
                        return k;
                    };
                for (i = 0; i < l; i++) {
                    var p1 = (i / (l - 1)).toFixed(2) * 1,
                        o = (1 - p1) * 0.8,
                        o1 = Cubic(o, m).toFixed(2),
                        c1 = 'rgba(' + c + ',' + c + ',' + c + ',' + o1 + ')';
                    grad.addColorStop(p1, c1);
                }
                ctx.fillStyle = grad;
                ctx.arc(p, p, r, 0, 2 * Math.PI);
                ctx.fill();
                var texture = new THREE.Texture(cvs);
                texture.needsUpdate = true;
                cvs = null;

                return texture;
            },
            /**
             * [creatBorderTexture 创建canvas点图片]
             * @Author   ZHOUPU
             * @DateTime 2018-08-02
             * @param    {[number]}   size  [图片大小参数]
             * @param    {[number]}   power [径向渐变参数]
             * @return   {[object]}         [THREE图片对象]
             */
            creatBorderTexture: function(size, power) {
                var s = size * 16 || 32,
                    m = power || 2,
                    cvs = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas'),
                    ctx = cvs.getContext("2d");
                cvs.width = s;
                cvs.height = s;
                var i, l = 8,
                    c = 255,
                    grad = ctx.createLinearGradient(0, 0, 0, s),
                    Cubic = function(k, n) {
                        if (n === 2) return k * k;
                        if (n === 3) return k * k * k;
                        return k;
                    };
                for (i = 0; i < l; i++) {
                    var p1 = 1 - (i / (l - 1)).toFixed(2) * 1,
                        o1 = 1 - Cubic(p1, m).toFixed(2) * 1,
                        c1 = 'rgba(' + c + ',' + c + ',' + c + ',' + o1 + ')';
                    grad.addColorStop(p1, c1);
                }
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, s, s);
                var texture = new THREE.Texture(cvs);
                texture.needsUpdate = true;
                cvs = null;

                return texture;
            },
            /**
             * [creatPlaneTexture 创建白色图片]
             * @Author   ZHOUPU
             * @DateTime 2018-08-29
             * @return   {[object]}   [THREE图片对象]
             */
            creatPlaneTexture: function() {
                var cvs = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas'),
                    ctx = cvs.getContext("2d"),
                    s = 8;
                cvs.width = cvs.height = s;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, s, s);
                var texture = new THREE.Texture(cvs);
                texture.needsUpdate = true;
                cvs = null;

                return texture;
            },
            /**
             * [creatRingsTexture 创建圆形渐变图片]
             * @Author   ZHOUPU
             * @DateTime 2018-09-13
             * @return   {[object]}   [THREE图片对象]
             */
            creatRingsTexture: function() {
                var cvs = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas'),
                    ctx = cvs.getContext("2d"),
                    s = 128;
                cvs.width = cvs.height = s;

                ctx.beginPath();
                var grad = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2 - 1);
                grad.addColorStop(0.7, 'rgba(214, 250, 250, 0.0)');
                grad.addColorStop(1.0, 'rgba(214, 250, 250, 0.2)');
                ctx.fillStyle = grad;
                ctx.arc(s / 2, s / 2, s / 2 - 1, 0, 2 * Math.PI);
                ctx.fill();

                ctx.beginPath();
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 1.2;
                ctx.arc(s / 2, s / 2, s / 2 - 1, 0, 2 * Math.PI);
                ctx.shadowBlur = 0.5;
                ctx.shadowColor = "#ffffff";
                ctx.stroke();
                ctx.closePath();

                var texture = new THREE.Texture(cvs);
                texture.needsUpdate = true;
                cvs = null;

                return texture;
            },

            /**
             * 解析geojson path为THREE形状
             * @param pathStr [svg path字符串]
             * @param fillStyle [填充方式, true-内部孔洞 false-外部区块]
             * @returns {Array} [THREE形状对象]
             */
            transformGeoJsonPath: function(series) {
                var paths = [],
                    fills = [],
                    geovec = undefined;
                var pathArr = series.path,
                    type = series._type, //当前集合类型 //Polygon MultiPolygon
                    scale = thm.SVGMapData.geoJsonScale || 1,
                    coordinateRange = thm.SVGMapData.coordinateRange,
                    pathParse;
                switch (type) {
                    case "Polygon":
                        pathParse = pathPolygon(pathArr);
                        paths.push(pathParse.path);
                        fills.push(pathParse.fill);
                        break;
                    case "MultiPolygon":
                        $.each(pathArr, function(a, b) {
                            pathParse = pathPolygon(b);
                            paths.push(pathParse.path);
                            fills.push(pathParse.fill);
                        });
                        break;
                }
                if (series.properties && series.properties.cp instanceof Array) {
                    geovec = {
                        x: (series.properties.cp[0] - coordinateRange[0]) * scale,
                        y: 0,
                        z: (-series.properties.cp[1] + coordinateRange[1]) * scale
                    }
                }
                return {
                    paths: paths,
                    fills: fills,
                    geovec: geovec
                };


                function pathPolygon(series) {
                    var path = new THREE.ShapePath(); //绘制路径
                    $.each(series, function(a, b) {
                        b = $.map(b, function(a2, b2) {
                            return {
                                x: a2[0],
                                y: a2[1]
                            }
                        });
                        if (a === 0) {
                            _Collects.reverse(b); //外圈是顺时针
                        } else {
                            _Collects.holeReverse(b); //孔逆时针
                        }
                        path.moveTo((b[0].x - coordinateRange[0]) * scale, (-b[0].y + coordinateRange[1]) * scale);
                        for (var a2 = 1, max2 = b.length; a2 < max2; a2++) {
                            path.lineTo((b[a2].x - coordinateRange[0]) * scale, (-b[a2].y + coordinateRange[1]) * scale);
                        }
                        if (b[a2 - 1].x !== b[0].x || b[a2 - 1].y !== b[0].y) {
                            path.lineTo((b[0].x - coordinateRange[0]) * scale, (-b[0].y + coordinateRange[1]) * scale);
                        }
                    });
                    return {
                        path: path,
                        fill: series.length > 1
                    };
                }
            },
            /**
             * 设置放大倍数等常数
             */
            setGeoJsonConst: function(thm) {
                var SVGMapData = thm.SVGMapData;
                var jwOpts = [
                        [SVGMapData.coordinateRange[0], SVGMapData.coordinateRange[1]],
                        [SVGMapData.coordinateRange[2], SVGMapData.coordinateRange[3]]
                    ],
                    xyOpts = [],
                    p, loop = 0;

                //缩放系数
                SVGMapData.geoJsonScale = thm._df_Tdata.wh / Math.max(SVGMapData.coordinateRange[2] - SVGMapData.coordinateRange[0], SVGMapData.coordinateRange[1] - SVGMapData.coordinateRange[3]);

                SVGMapData._width = SVGMapData._width * 　SVGMapData.geoJsonScale;
                SVGMapData._height = SVGMapData._height * 　SVGMapData.geoJsonScale;

                //基准坐标设置
                if (SVGMapData.series["0"].path[0][0][0] instanceof Array) {
                    do {
                        p = SVGMapData.series["0"].path[0][0][loop];
                        loop++;
                    } while (unique(p))
                } else {
                    do {
                        p = SVGMapData.series["0"].path[0][loop];
                        loop++;
                    } while (unique(p))
                }
                jwOpts.push(p);

                for (var k in jwOpts) {
                    xyOpts.push([
                        (jwOpts[k][0] - SVGMapData.coordinateRange[0]) * SVGMapData.geoJsonScale,
                        (-jwOpts[k][1] + SVGMapData.coordinateRange[1]) * SVGMapData.geoJsonScale
                    ]);
                }

                thm.setCoordTrans(xyOpts, jwOpts);
                //基准点不能相同
                function unique(p) {
                    if (loop > 3) {
                        return false;
                    }
                    return (p[0] === SVGMapData.coordinateRange[0] || p[0] === SVGMapData.coordinateRange[2])
                }

            }

        };
        /**
         * [_Materials 常用材质对象]
         * @type {Object}
         */
        var _Materials = {
            point: function(param) {
                return new THREE.PointsMaterial(param);
            },
            line: function(param) {
                return new THREE.LineBasicMaterial(param);
            },
            lineD: function(param) {
                return new THREE.LineDashedMaterial(param);
            },

            sprite: function(param) {
                return new THREE.SpriteMaterial(param);
            },
            shader: function(param) {
                return new THREE.ShaderMaterial(param);
            },
            phong: function(param) {
                return new THREE.MeshPhongMaterial(param);
            },
            basic: function(param) {
                return new THREE.MeshBasicMaterial(param);
            },
            lambert: function(param) {
                return new THREE.MeshLambertMaterial(param);
            },
            standard: function(param) {
                return new THREE.MeshStandardMaterial(param);
            },
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

            shape: function(shp, seg) {
                return new THREE.ShapeGeometry(shp, seg);
            },
            extrude: function(shp, opt) {
                return new THREE.ExtrudeGeometry(shp, opt);
            },

            box: function(w, h, d) {
                return new THREE.BoxGeometry(w, h, d);
            },
            sphere: function(r, ws, hs) {
                return new THREE.SphereGeometry(r, ws, hs);
            },
            torus: function(r, t, rs, ts) {
                return new THREE.TorusGeometry(r, t, rs, ts);
            },
            circle: function(r, s) {
                return new THREE.CircleGeometry(r, s);
            },
            Icosah: function(r, s) {
                return new THREE.IcosahedronGeometry(r, s);
            },
            plane: function(w, h, ws, hs) {
                return new THREE.PlaneGeometry(w, h, ws, hs);
            },
            cylinder: function(rt, rb, h, rs, o) {
                return new THREE.CylinderGeometry(rt, rb, h, rs, 1, o);
            },
        };

        //-
        /**
         * [init3DMesh 初始svg底图]
         * @Author   ZHOUPU
         * @DateTime 2018-08-02
         * @param    {[object]}   data [svg数据对象]
         * @return   {[void]}
         */
        function init3DMesh(data) {
            if (data != undefined) {
                thm.SVGMapData = $.extend(true, {}, data);

                if (thm.SVGMapLayers) {
                    thm.LayersArray = [];
                    thm.LayersOrder = [];
                    thm.LayersLength = 0;

                    disposeObj(thm.SVGMapLayers);
                    thm.SVGMapLayers = null;
                }
                thm.SVGMapLayers = _Collects.obj();
                thm.scene.add(thm.SVGMapLayers);
                thm.SVGMapLayers.visible = false;
            }

            // 更新删除原数据
            if (thm.mapObject) {
                thm.shapesArr = [];
                thm.mEventArr = [];
                thm.SVGMapObj = {};
                thm.shapesArrLen = 0;
                df_animationArr = [];

                disposeObj(thm.mapObject);
                thm.mapObject = null;
                df_ItdMesh = null;
                df_SltMesh = null;
            }
            if (thm.outBorderObj) {
                disposeObj(thm.outBorderObj);
                thm.outBorderObj = null;
            }
            thm.mapObject = _Collects.obj();
            thm.scene.add(thm.mapObject);
            thm.outBorderObj = _Collects.obj();
            thm.scene.add(thm.outBorderObj);

            //- 处理配置项参数
            if (!df_Config.__isWorked) {
                _Collects.handleTags();

                _Collects.handleBlock();
                _Collects.handleBorder();
                _Collects.handleOutBorder();

                _Collects.handleGlow();
                _Collects.handlePoint();
                _Collects.handleGlowBlending();

                _Collects.handleShadow();
                _Collects.handleSuspend();
                df_Config.__isWorked = true;
            }
            if (thm.SVGMapData && thm.SVGMapData.series) {
                handleSeries();

                //- 缩放和偏移
                thm.mapObject.scale.copy(thm.WHRatio);
                thm.mapObject.position.copy(thm.svgOffset);
                thm.outBorderObj.scale.copy(thm.WHRatio);
                thm.outBorderObj.position.copy(thm.svgOffset);

                thm.SVGMapLayers.renderOrder = 1;
                thm.SVGMapLayers.scale.copy(thm.WHRatio);
                thm.SVGMapLayers.position.copy(thm.svgOffset.clone().add(new THREE.Vector3(0, thm.SVGMapLayers._py, 0)));

                //- 根据缩放参数矫正参数
                var _BlockTxue = df_Config.sceneStyle.blockTexture,
                    _maxXZ = Math.max(thm.mapObject._size.x, thm.mapObject._size.z),
                    _wh = new THREE.Vector2(_maxXZ, _maxXZ),
                    _off = new THREE.Vector2(thm.mapObject._offset.x, thm.mapObject._offset.z);
                for (var j = thm.shapesArrLen - 1, k = 0; j >= 0; j--, k++) {
                    var shi = thm.shapesArr[j];
                    //- 扩展中心点
                    var _r1 = Math.random(),
                        _r2 = Math.random(),
                        _vec = new THREE.Vector3(_r1 * 10 + 10, 1, _r2 * 10 + 10);
                    shi._center.multiply(thm.WHRatio).add(thm.svgOffset);
                    shi._admisDic = shi._center.clone().multiply(_vec);

                    //- 矫正大小
                    shi.children[0].children[1].material.uniforms.u_width.value /= thm.WHRatio.x;

                    //- 区块纹理
                    if (_BlockTxue) {
                        var shi0 = shi.children[0],
                            _white = new THREE.Color();

                        shi0._color = _white;
                        shi0.material.uniforms.u_txue.value = _BlockTxue;
                        shi0.material.uniforms.u_color.value.set(_white);

                        shi0.material.uniforms.u_WH.value = _wh.clone();
                        shi0.material.uniforms.u_offset.value = _off.clone();

                        shi0.material.needsUpdate = true;
                    }
                }
                thm.outBorderObj.children.forEach(function(node) {
                    if (node && node.children[0]) {
                        node.children[0].material.uniforms.u_width.value /= thm.WHRatio.x;
                        node.children[1].material.uniforms.u_width.value /= thm.WHRatio.x;
                        node.children[2].material.uniforms.u_width.value /= thm.WHRatio.x;
                    }
                });
            }
        }
        function _creatColMap(series) {
        }
        /**
         * [handleSeries 处理SVG底图数据和配置参数对象，构成场景元素]
         * @Author   ZHOUPU
         * @DateTime 2018-08-02
         * @return   {[void]}
         */
        function handleSeries() {

            var series = thm.SVGMapData.series || [],
                // 投影
                sc = df_Config.controls.shadowColor,
                eh = df_Config.controls.shadowRate,
                stp = df_Config.controls.shadowType,
                sl = df_Config.controls.shadowLayers,
                // 标签
                _tOpt = {
                    st: df_Config.tags.showTags,
                    fc: df_Config.tags.fontColor,
                    fh: df_Config.tags.fontHover,
                    fs: df_Config.tags.fontSize,
                    fw: df_Config.tags.fontWeight
                },
                // 区块 & 高亮
                bc = df_Config.sceneStyle.blockColor,
                _opt = {
                    eh: eh,
                    bc: bc[0],
                    hlc: df_Config.sceneStyle.highLightColor
                },
                // 边框
                lc = df_Config.sceneStyle.borderColor,
                lw = df_Config.sceneStyle.borderWidth,
                ls = df_Config.sceneStyle.borderStyle,
                lhc = df_Config.sceneStyle.borderHLColor,
                // 外边框
                obc = df_Config.sceneStyle.outBorderColor,
                obw = df_Config.sceneStyle.outBorderWidth,
                // 外发光
                _gopt = {
                    gsw: df_Config.outerGlow.glowShow,
                    gc: df_Config.outerGlow.glowColor,
                    gs: df_Config.outerGlow.glowSize,
                    gp: df_Config.outerGlow.glowPlace,
                    gbld: df_Config.outerGlow.isGlowBlending,

                    psw: df_Config.outerGlow.pointShow,
                    pc: df_Config.outerGlow.pointColor,
                    ps: df_Config.outerGlow.pointSize,
                    pd: df_Config.outerGlow.pointDensity,
                    pt: df_Config.outerGlow.perTime,

                    ptxue: df_Config.outerGlow.pointTexture
                };

            var maxEH = 0,
                _nky, _vec, _bbox, _BMin, _BMax,
                hasBD = thm.SVGMapData._hasBorder;

            if (thm.SVGMapData.geojson) {
                //如果是geojson设置放大倍数等常数
                _Collects.setGeoJsonConst(thm);
            }
            //-
            for (var i = series.length - 1; i >= 0; i--) {
                var _id = series[i]._id;
                if (_id == undefined) continue;

                var _t = series[i].name || "",
                    _of = series[i].offset || [],
                    _fxy = series[i].pathTrans || [0, 0],
                    _ofx = _Collects.clamp(_of[0] * 1, -Infinity, Infinity, 0),
                    _ofy = _Collects.clamp(_of[1] * 1, -Infinity, Infinity, 0),
                    _h = isNaN(series[i].height * 4) ? 4 : series[i].height * 4,
                    _seg = _Collects.clamp(series[i].segDensity * 1, 1.6, 3.2, 2.4),
                    _fs = (series[i].fillStyle === true),
                    _isBD = (series[i].isBorder === true);

                var _copts = {
                    seg: _seg,
                    id: i
                };
                var _ShapesArr,
                    _geofs, //geoJson孔标识 true 有空
                    _geovec,
                    _geoPath;
                if (thm.SVGMapData.geojson) {
                    //geojson处理
                    _geofs = [];
                    _geoPath = _Collects.transformGeoJsonPath(series[i]);
                    _ShapesArr = _geoPath.paths;
                    _geofs = _geoPath.fills;
                    _geovec = _geoPath.geovec;
                } else {
                    _ShapesArr = _Collects.transformSVGPath(series[i].path, _fs);
                }
                for (var j = 0, _sl = _ShapesArr.length; j < _sl; j++) {
                    var _Shapes = _ShapesArr[j].toShapes(thm.SVGMapData.geojson ? _geofs[j] : _fs);
                    if (!_Shapes[0] || _Shapes[0].getLength() < 0.001) continue;
                    var geoObj = _Collects.creatCommonGeo(_Shapes[0], _fxy, _copts);

                    var _sGeo = geoObj.sgeo,
                        _bGeo = geoObj.bgeo;

                    //- 计算中心和半径
                    _sGeo.computeBoundingBox();
                    _bbox = _sGeo.boundingBox;
                    _vec = _sGeo.boundingBox.getCenter();
                    //-
                    _BMin = !_BMin ? _bbox.min.clone() : _BMin.min(_bbox.min);
                    _BMax = !_BMax ? _bbox.max.clone() : _BMax.max(_bbox.max);

                    _nky = eh * _h;
                    maxEH = Math.max(_nky, maxEH);
                    var mhy = -((_nky + 1.1) * 0.4).toFixed(2) * 1,
                        shy = eh < 1 ? -thm._df_Tdata.ry - eh : -_nky - 1.1;

                    if (!_isBD) {

                        var _extr = _Collects.creatShape(_sGeo, _opt, 0, _h, false),
                            _nExtr = _Collects.creatShape(_sGeo, _opt, _nky, _h, true),
                            _border = _Collects.creatBorder(_bGeo, _opt.bc, eh, _h, 0.1),
                            _line = _Collects.creatSVGLine(_bGeo, lc, lw, _h, 0.1, ls, lhc),
                            _glow = !hasBD ? _Collects.creatOuterGlow(geoObj.gGeoArr, _gopt, eh, _h) : _Collects.obj();

                        //中心center
                        if (_geovec) {
                            _geovec = _vec.clone().set(_geovec.x, _geovec.y, _geovec.z);
                        }

                        _border.visible = _border._visible = stp == 0 ? true : false;

                        _nExtr._center = _extr._center = (_geovec || _vec).clone().setY(_nky);
                        _nExtr._path_id = _extr._path_id = _id;
                        _nExtr._mhover = _extr._mhover = true;
                        _nExtr._bbox = _extr._bbox = _bbox;
                        _nExtr._name = _extr._name = _t;
                        _nExtr._gid = _extr._gid = i;
                        _nExtr._bid = _extr._bid = j;

                        //- 标签文字
                        var _txue = _Collects.creatTagsTxue( ( j == 0?_t:"" ) ); //每个区块只添加一个标签文字

                        // if (thm.SVGMapData.geojson && j != 0) { //geojson 每个区块只添加一个标签文字
                        // var _txue = _Collects.creatTagsTxue('');
                        // } else {
                        // var _txue = _Collects.creatTagsTxue(_t);
                        // }
                        var _tags = _Collects.creatTags(_txue, _tOpt, (_geovec || _vec), _ofx, _ofy);

                        _extr.add(_border, _line, _glow, _tags);
                        _nExtr.add(_extr);

                        //- 投影
                        var sc0 = (bc[1] && stp == 1) ? bc[1] : sc,
                            sc1 = (bc[sl - 1] && stp == 1) ? bc[sl - 1] : sc0,
                            mp = (bc[1] && stp == 1) ? 1 : 0.85,
                            sp = (bc[sl - 1] || stp == 0) ? 1 : bc[1] ? mp * .85 : 0.5;

                        var _middle = _Collects.creatShadow(_sGeo, sc0, mp, mhy, true),
                            _shadow = _Collects.creatShadow(_sGeo, sc1, sp, shy, false);

                        _middle.visible = _middle._visible = (stp == 1 && sl == 3) ? true : false;
                        _middle._path_id = _shadow._path_id = _id;
                        _middle._gid = _shadow._gid = i;
                        _nExtr.add(_middle, _shadow);

                        //-
                        thm.mapObject.add(_nExtr);
                        thm.shapesArr.push(_nExtr);
                        thm.mEventArr.push(_nExtr);
                        thm.shapesArrLen += 1;

                        series[i].offset = [_ofx, _ofy];
                        thm.SVGMapObj[_id] = series[i];
                    }

                    if (_isBD) {
                        var lc0 = obc[0] ? obc[0] : lc,
                            lc1 = obc[1] ? obc[1] : lc,
                            lc2 = obc[sl - 1] ? obc[sl - 1] : lc1;
                        var _obr = _Collects.obj(),
                            _line0 = _Collects.creatSVGLine(_bGeo, lc0, obw, _h, 0.1, ls),
                            _line1 = _Collects.creatSVGLine(_bGeo, lc1, obw, _h, mhy + 0.1, ls),
                            _line2 = _Collects.creatSVGLine(_bGeo, lc2, obw, _h, shy + 0.1, ls),
                            _glow = hasBD ? _Collects.creatOuterGlow(geoObj.gGeoArr, _gopt, eh, _h) : _Collects.obj();

                        _line1.visible = _line1._visible = (stp == 1 && sl == 3) ? true : false;
                        _line2.visible = _line2._visible = (stp == 1) ? true : false;
                        _obr.add(_line0, _line1, _line2, _glow);
                        _obr.position.y = _nky;
                        _obr._isOutBorder = true;
                        _obr._hRatio = _h;

                        thm.outBorderObj.add(_obr);
                    }

                }
            }
            thm.SVGMapLayers._py = maxEH;
            thm.mapObject._size = new THREE.Vector3();
            thm.mapObject._offset = new THREE.Vector3();

            //- 获取底图的缩放和偏移系数
            if (!!_BMin && !!_BMax) {
                var _size = _BMax.sub(_BMin),
                    _offset = _size.clone().multiplyScalar(0.5).add(_BMin),
                    _rat = thm._df_Tdata.wh / Math.max(_size.x, _size.z);

                thm.WHRatio.set(_rat, 1, _rat);
                thm.svgOffset.set(-_offset.x * _rat, 0, -_offset.z * _rat);
                thm.mapObject._offset.copy(_offset);
                thm.mapObject._size.copy(_size);
            }
        }

        //- animation
        /**
         * [animation 场景所有动画入口方法]
         * @Author   ZHOUPU
         * @DateTime 2018-08-02
         * @param    {[number]}   dt [帧时长]
         * @return   {[void]}
         */
        function animation(dt) {

            if (dt < .1 && df_MouseEvent) {
                //动画接口
                for (var key in df_OnRenderCallback) {
                    df_OnRenderCallback[key](dt,df_Clock);
                }
                // 默认动画
                df_animationArr.forEach(function(child) {
                    if (child._isGlow && child._type == 2 && child.visible) {
                        if (child._flicker) {
                            var _times = child._perTimes;
                            child._transTimes += dt;
                            var _k = child._ratio - child._transTimes / _times;
                            if (_k >= 0) _k += 1;
                            child.material.uniforms.u_opacity.value = child._opacity * (.8 + Math.cos(_k * thm._df_Tdata.M_PI) * .2);
                            if (child._transTimes >= _times) child._transTimes -= _times;
                        }
                    }
                });
            }

            df_AdmisDic.type && thm.shapesArrLen && setAdmisDic(dt);
            !df_AdmisDic.type && thm.shapesArrLen && AdmisDicRestore();

            df_MouseEvent && df_onAnim && setAnmi(dt);

            if (df_Carousel) {
                df_carouTransTime += dt;
                if (df_carouTransTime > df_carouTime) {
                    if (df_ItdMesh) {
                        if (df_ItdMesh._isShape) {
                            //_Collects.mouseMoveIn(df_ItdMesh);
                            _Collects.mouseMoveOut(df_ItdMesh);
                        }
                        if (df_ItdMesh._isBackLabels && thm.pointMap) {
                            thm.pointMap._mouseMoveOut();
                        }
                        if (df_ItdMesh._isMigMapBackLabels && thm.migrateMap) {
                            thm.migrateMap._mouseMoveOut();
                        }
                        if (df_ItdMesh._isMLine && thm.migrateMap) {
                            thm.migrateMap._mouseMoveOut();
                        }
                        //- by LiLingLing on time 2019/7/23 添加
                        if (df_ItdMesh._isColumnar && thm.columnarMap) {
                            thm.columnarMap._mouseMoveOut( df_ItdMesh );
                        }
                        df_ItdMesh = null;
                    }
                    if (df_currentObj) {
                        _Collects.mouseMoveOut(df_currentObj);
                        df_currentObj = null;
                    }

                    df_currentObj = thm.mapObject.children[df_carouID].children[0];
                    _Collects.mouseMoveIn( df_currentObj );
                    if (df_carouCallback) df_carouCallback(thm.SVGMapObj[df_currentObj._path_id]);

                    df_carouTransTime = 0;
                    df_carouID++;
                    df_carouID %= thm.mapObject.children.length;
                }
            } else if (df_currentObj) {
                _Collects.mouseMoveOut(df_currentObj);
                df_currentObj = null;
            }
        }

        /**
         * [setAnmi 点击效果  单击放大、双击放大 动画]
         * @Author   ZHOUPU
         * @DateTime 2018-08-29
         * @param    {[number]}   dt [帧时长]
         */
        function setAnmi(dt) {
            var _per = df_tAnim.perTime;
            if (df_tAnim.transTimes >= _per) return;

            if (dt < .1) {

                if (df_tAnim.transTimes == 0) {
                    var _BMin, _BMax, _key, _rt, _off;
                    for (var j = thm.shapesArrLen - 1; j >= 0; j--) {
                        var shpi = thm.shapesArr[j],
                            shpicc = shpi.children[0].children;
                        shpicc[1].visible = false;
                        shpicc[2].visible = false;
                        shpicc[3].visible = false;

                        if (df_tAnim.id[0] == shpi._path_id || df_tAnim.id[1] == shpi._path_id) {
                            _BMin = !_BMin ? shpi._bbox.min.clone() : _BMin.min(shpi._bbox.min);
                            _BMax = !_BMax ? shpi._bbox.max.clone() : _BMax.max(shpi._bbox.max);
                        }
                    }
                    _key = _BMax.clone().sub(_BMin);
                    _rt = thm._df_Tdata.wh / (_key.length() * 1.1);
                    _off = _key.clone().multiplyScalar(0.5).add(_BMin);
                    df_tAnim.WHRatio = new THREE.Vector3(_rt, _rt, _rt);
                    df_tAnim.svgOffset = new THREE.Vector3(-_off.x * _rt, 0, -_off.z * _rt);
                }

                df_tAnim.transTimes += dt;
                var _s, _p,
                    _k = Math.min(1, df_tAnim.transTimes / _per),
                    vec1 = new THREE.Vector3(1 - _k, 1 - _k, 1 - _k),
                    vec2 = new THREE.Vector3(_k * _k, _k, _k * _k);


                for (var j = thm.shapesArrLen - 1; j >= 0; j--) {
                    var shpi = thm.shapesArr[j];
                    if (df_tAnim.type === 1) {
                        if (df_tAnim.id[0] == shpi._path_id || df_tAnim.id[1] == shpi._path_id) {
                            if (df_tAnim.transTimes == dt) {
                                thm.mEventArr.forEach(function(node) {
                                    if (!node._isshapeLable) {
                                        if (node._isBackLabels) {
                                            if (node._name == shpi._name) {
                                                node._isStarts = true;
                                                node.visible = node._visible != undefined ? node._visible : true;
                                                node.parent.visible = node.parent._visible != undefined ? node.parent._visible : true;
                                            } else if (!node._isStarts) {
                                                node.visible = false;
                                                node.parent.visible = false;
                                            }
                                        }
                                        if (node._isMLine) {
                                            node.visible = false;
                                            node.parent.visible = false;
                                        }
                                    }
                                });
                                thm.migrateMap && df_tAnim.node && thm.migrateMap.setMigMapDistrictApm(df_tAnim.node);
                                thm.SVGMapLayers.children.forEach(function(child) {
                                    if (child._isHeatMap) child.visible = false;
                                });
                                thm.outBorderObj.visible = false;

                                shpi._mhover = shpi.children[0]._mhover = true;

                                var _g = shpi._gid;

                                if (df_tAnim.SId <= 0) df_tAnim.showArr.push(_g, _g, _g, _g);
                                else df_tAnim.showArr[df_tAnim.SId] = _g;

                                shpi.children[1].material.uniforms.u_showGId.value.fromArray(df_tAnim.showArr);
                                shpi.children[2].material.uniforms.u_showGId.value.fromArray(df_tAnim.showArr);
                                df_tAnim.SId++;
                            }
                            _s = thm.WHRatio.clone().multiply(vec1).add(df_tAnim.WHRatio.clone().multiply(vec2));
                            _p = thm.svgOffset.clone().multiply(vec1).add(df_tAnim.svgOffset.clone().multiply(vec2));

                            if (_k >= 1) {
                                var shpicc = shpi.children[0].children;
                                shpicc[1].visible = true;
                                shpicc[2].visible = true;
                                if (shpicc[2].children[0]) {
                                    shpicc[2].children[0].material.size = shpicc[2].children[0]._size * _s.x;
                                }
                                shpicc[3].visible = shpicc[3]._visible != undefined ? shpicc[3]._visible : true;
                            }
                        } else {
                            if (df_tAnim.transTimes == dt) {
                                shpi._mhover = shpi.children[0]._mhover = false;
                            }
                            _Collects.opacityTvs(shpi.children[0], (1 - _k) * (1 - _k) * (1 - _k));
                            if (_k >= 1) {
                                shpi.visible = false;
                            }
                        }
                    }
                    if (df_tAnim.type === 2) {
                        if (j == thm.shapesArrLen - 1) {
                            _s = df_tAnim.WHRatio.clone().multiply(vec1).add(thm.WHRatio.clone().multiply(vec2));
                            _p = df_tAnim.svgOffset.clone().multiply(vec1).add(thm.svgOffset.clone().multiply(vec2));
                        }
                        _Collects.opacityTvs(shpi.children[0], _k * _k);
                        if (df_tAnim.transTimes == dt) {
                            shpi.visible = true;
                        }

                        if (_k >= 1) {
                            if (j == 0) {
                                thm.mEventArr.forEach(function(node) {
                                    if (!node._isshapeLable) {
                                        if (node._isBackLabels) {
                                            node._isStarts = false;
                                            node.visible = node._visible != undefined ? node._visible : true;
                                            node.parent.visible = node.parent._visible != undefined ? node.parent._visible : true;
                                        }
                                        if (node._isMLine) {
                                            node.visible = node._visible != undefined ? node._visible : true;
                                            node.parent.visible = node.parent._visible != undefined ? node.parent._visible : true;
                                        }
                                    }
                                });
                                thm.migrateMap && thm.migrateMap.setMigMapDistrictApm();
                                thm.SVGMapLayers.children.forEach(function(child) {
                                    if (child._isHeatMap) child.visible = child._visible != undefined ? child._visible : true;
                                });
                                thm.outBorderObj.visible = true;

                                shpi.children[1].material.uniforms.u_showGId.value.set(-1, -1, -1, -1);
                                shpi.children[2].material.uniforms.u_showGId.value.set(-1, -1, -1, -1);
                            }
                            shpi._mhover = shpi.children[0]._mhover = true;
                            var shpicc = shpi.children[0].children;
                            shpicc[1].visible = true;
                            shpicc[2].visible = true;
                            if (shpicc[2].children[0]) {
                                shpicc[2].children[0].material.size = shpicc[2].children[0]._size;
                            }
                            shpicc[3].visible = shpicc[3]._visible != undefined ? shpicc[3]._visible : true;
                        }
                    }
                }

                thm.mapObject.scale.copy(_s);
                thm.mapObject.position.copy(_p);

                thm.SVGMapLayers.scale.copy(_s);
                thm.SVGMapLayers.position.set(_p.x, thm.SVGMapLayers._py * _s.y, _p.z);

                if (_k >= 1) {
                    df_onAnim = false;
                }
            }
        }

        /**
         * [setAdmisDic 设置入场动画]
         * @Author   ZHOUPU
         * @DateTime 2018-08-02
         * @param    {[number]}   dt [帧时长]
         */
        function setAdmisDic(dt) {
            var _per = df_AdmisDic.perTime;
            if (df_AdmisDic._transTimes >= _per) return;

            AdmisDicBefore();

            //-
            df_AdmisDic._transTimes += dt;
            var _k = Math.min(1, df_AdmisDic._transTimes / _per),
                _rk = 1 - _k,
                _m = .01 + .99 * _k * (2 - _k),
                _o = _k > .75 ? 3 - 2 * _k : 2 * _k,
                _so = _k > .5 ? (2 * _k - 1) * (2 * _k - 1) : 0;

            for (var j = thm.shapesArrLen - 1; j >= 0; j--) {
                var shpi = thm.shapesArr[j],
                    shpic = shpi.children[0],
                    shpicc = shpic.children;
                if (df_AdmisDic.type === 1) {
                    var vec = new THREE.Vector3(_rk * _rk * _rk, 1, _rk * _rk * _rk);
                    shpi.position.copy(shpi._admisDic.clone().multiply(vec));

                    shpicc[2].traverse(function(child) {
                        if (child._isGlow) {
                            child.material.opacity = child._opacity * _o;
                        }
                    });
                    shpicc[3].material.opacity = shpicc[3]._opacity * _so;
                }
                if (df_AdmisDic.type === 2) {
                    shpic.material.opacity = shpic._opacity * _m;
                    shpicc[2].traverse(function(child) {
                        if (child._isGlow) {
                            child.material.opacity = child._opacity * _so;
                        }
                    });
                    shpicc[3].material.opacity = shpicc[3]._opacity * _so;
                    shpicc[1].material.uniforms.u_opacity.value = shpicc[1]._opacity * _k;
                    shpicc[0].material.uniforms.u_opacity.value = shpicc[0]._opacity * _k;
                }
            }
            if (df_AdmisDic.type === 2) {
                thm.mapObject.scale.copy(thm.WHRatio.clone().multiplyScalar(_m));
                thm.mapObject.position.copy(thm.svgOffset.clone().multiplyScalar(_m));
            }

            if (_k >= 1) {
                df_MouseEvent = true;
                thm.SVGMapLayers.visible = true;
                thm.outBorderObj.visible = true;
            }

        }
        /**
         * [AdmisDicBefore 入场动画前置设置]
         * @Author   ZHOUPU
         * @DateTime 2018-08-02
         */
        function AdmisDicBefore() {
            if (df_AdmisDic._transTimes < 0) {
                if (df_AdmisDic.type === 1) {
                    thm.mapObject.scale.copy(thm.WHRatio);
                    thm.mapObject.position.copy(thm.svgOffset);
                }
                if (df_AdmisDic.type === 2) {
                    var _s = 0.001;
                    thm.mapObject.scale.set(_s, _s, _s);
                    thm.mapObject.position.set(0, 0, 0);
                }
                df_MouseEvent = false;
                df_AdmisDic._transTimes = 0;
                for (var j = thm.shapesArrLen - 1; j >= 0; j--) {
                    var shpi = thm.shapesArr[j],
                        shpic = shpi.children[0],
                        shpicc = shpic.children;
                    if (df_AdmisDic.type === 1) {
                        shpi.position.copy(shpi._admisDic.clone());

                        shpic.material.opacity = shpic._opacity;
                        shpicc[0].material.uniforms.u_opacity.value = shpicc[0]._opacity;
                        shpicc[1].material.uniforms.u_opacity.value = shpicc[1]._opacity;
                    }
                    if (df_AdmisDic.type === 2) {
                        shpi.position.set(0, shpi._admisDic.y, 0);

                        shpic.material.opacity = 0;
                        shpicc[0].material.uniforms.u_opacity.value = 0;
                        shpicc[1].material.uniforms.u_opacity.value = 0;
                    }

                    shpicc[2].traverse(function(child) {
                        if (child._isGlow) {
                            child.material.opacity = 0;
                        }
                    });
                    shpicc[3].material.opacity = 0;
                }
                thm.SVGMapLayers.visible = false;
                thm.outBorderObj.visible = false;
            }
        }
        /**
         * [AdmisDicRestore 入场动画重置]
         * @Author   ZHOUPU
         * @DateTime 2018-08-02
         */
        function AdmisDicRestore() {
            if (undefined == df_AdmisDic._transTimes || df_AdmisDic._transTimes < 0) return;

            thm.mapObject.scale.copy(thm.WHRatio);
            thm.mapObject.position.copy(thm.svgOffset);
            df_MouseEvent = true;
            df_AdmisDic._transTimes = -1;
            for (var j = thm.shapesArrLen - 1; j >= 0; j--) {
                var shpi = thm.shapesArr[j];
                shpi.position.set(0, shpi._admisDic.y, 0);
                shpi.children[0].traverse(function(child) {
                    if (child.material) {
                        if (!child.material.uniforms) child.material.opacity = child._opacity;
                        else child.material.uniforms.u_opacity.value = child._opacity;
                    }
                });
            }
            thm.SVGMapLayers.visible = true;
            thm.outBorderObj.visible = true;
        }

        // mouse event
        /**
         * [onDocumentMouseOut 鼠标移出事件方法]
         * @Author   ZHOUPU
         * @DateTime 2018-08-02
         * @param    {[type]}   event [事件event]
         * @return   {[void]}
         */
        function onDocumentMouseOut(event) {
            thm.renderer.domElement.style.cursor = 'auto';

            if (df_ItdMesh) {
                if (df_ItdMesh._isShape) {
                    _Collects.mouseMoveOut(df_ItdMesh);
                    df_MouseHoverCallback(false);
                }
                if (df_ItdMesh._isBackLabels && thm.pointMap) {
                    thm.pointMap._mouseMoveOut();
                }
                if (df_ItdMesh._isMigMapBackLabels && thm.migrateMap) {
                    thm.migrateMap._mouseMoveOut();
                }
                if (df_ItdMesh._isMLine && thm.migrateMap) {
                    thm.migrateMap._mouseMoveOut();
                }
                //- by LiLingLing on time 2019/7/23 添加
                if (df_ItdMesh._isColumnar && thm.columnarMap) {
                    thm.columnarMap._mouseMoveOut( df_ItdMesh );
                }
            }
            df_ItdMesh = null;
        }
        /**
         * [onDocumentMouseMove 鼠标移入事件方法]
         * @Author   ZHOUPU
         * @DateTime 2018-08-02
         * @param    {[type]}   event [事件event]
         * @return   {[void]}
         */
        function onDocumentMouseMove(event) {
            event.preventDefault();
            if (df_MouseEvent && thm._animation) {
                //-轮播时间归零
                df_carouTransTime = 0;
                if (df_currentObj) {
                    //_Collects.mouseMoveIn(df_currentObj);
                    _Collects.mouseMoveOut(df_currentObj);
                    df_currentObj = null;
                }
                df_Mouse.x = (event.layerX / df_Width) * 2 - 1;
                df_Mouse.y = -(event.layerY / df_Height) * 2 + 1;
                df_Raycaster.setFromCamera(df_Mouse, thm.camera);
                df_Intersects = df_Raycaster.intersectObjects(thm.mEventArr);

                if (df_Intersects.length > 0 && df_Intersects[0].object._mhover == undefined) {
                    df_Intersects[0].object._mhover = true;
                }

                if (df_Intersects[0] && df_Intersects[0].object._mhover) {
                    thm.renderer.domElement.style.cursor = 'pointer';

                    var _obj = df_Intersects[0].object;
                    if ((df_ItdMesh != _obj&&df_ItdMesh != _obj.children[0])||df_ItdMesh==null) {
                        if (df_ItdMesh) {
                            if (df_ItdMesh._isShape) {
                                _Collects.mouseMoveOut(df_ItdMesh);
                            }
                            if (df_ItdMesh._isBackLabels && thm.pointMap) {
                                thm.pointMap._mouseMoveOut();
                            }
                            if (df_ItdMesh._isMigMapBackLabels && thm.migrateMap) {
                                thm.migrateMap._mouseMoveOut();
                            }
                            if (df_ItdMesh._isMLine && thm.migrateMap) {
                                thm.migrateMap._mouseMoveOut();
                            }
                            //- by LiLingLing on time 2019/7/23 添加
                            if (df_ItdMesh._isColumnar && thm.columnarMap) {
                                thm.columnarMap._mouseMoveOut( df_ItdMesh );
                            }
                        }

                        if (_obj._isShape) {
                            df_ItdMesh = _obj.children[0];
                            _Collects.mouseMoveIn(df_ItdMesh);

                            var _id = _obj._path_id;
                            df_MouseHoverCallback(
                                _id, transCoord(_obj._center),
                                $.extend(true, {}, thm.SVGMapObj[_id]),
                                $.extend(true, {}, thm.SVGMapData), event
                            );
                        }

                        if (_obj._isBackLabels && thm.pointMap) {
                            df_ItdMesh = _obj;
                            thm.pointMap._mouseMoveIn(df_Intersects);
                            thm.pointMap._mouseHover(df_Intersects, event);
                        }

                        if (_obj._isMigMapBackLabels && thm.migrateMap) {
                            df_ItdMesh = _obj;
                            thm.migrateMap._mouseMoveIn(df_Intersects);
                            thm.migrateMap._mouseHover(df_Intersects, event);
                        }

                        if (_obj._isMLine && thm.migrateMap) {
                            df_ItdMesh = _obj;
                            thm.migrateMap._mouseMoveIn(df_Intersects);
                            thm.migrateMap._mouseHover(df_Intersects, event);
                        }

                        //- by LiLingLing on time 2019/7/23 添加
                        if (_obj._isColumnar && thm.columnarMap) {
                            df_ItdMesh = _obj;
                            thm.columnarMap._mouseMoveIn( df_ItdMesh, event );
                        }
                    }
                } else {
                    thm.renderer.domElement.style.cursor = 'auto';

                    if (df_ItdMesh) {
                        if (df_ItdMesh._isShape) {
                            _Collects.mouseMoveOut(df_ItdMesh);
                            df_MouseHoverCallback(false);
                        }
                        if (df_ItdMesh._isBackLabels && thm.pointMap) {
                            thm.pointMap._mouseMoveOut();
                        }
                        if (df_ItdMesh._isMigMapBackLabels && thm.migrateMap) {
                            thm.migrateMap._mouseMoveOut();
                        }
                        if (df_ItdMesh._isMLine && thm.migrateMap) {
                            thm.migrateMap._mouseMoveOut();
                        }
                        //- by LiLingLing on time 2019/7/23 添加
                        if (df_ItdMesh._isColumnar && thm.columnarMap) {
                            thm.columnarMap._mouseMoveOut( df_ItdMesh );
                        }
                    }
                    df_ItdMesh = null;
                }
            }

        }
        /**
         * [onDocumentMouseDown 点击事件方法]
         * @Author   ZHOUPU
         * @DateTime 2018-08-02
         * @param    {[type]}   event [事件event]
         * @return   {[void]}
         */
        function onDocumentMouseDown(event) {
            event.preventDefault();
            clearTimeout(df_dbClickDelay);
            df_dbClickDelay = setTimeout(function() {
                if (thm._animation) {
                    df_Mouse.x = (event.layerX / df_Width) * 2 - 1;
                    df_Mouse.y = -(event.layerY / df_Height) * 2 + 1;
                    df_Raycaster.setFromCamera(df_Mouse, thm.camera);
                    df_Intersects = df_Raycaster.intersectObjects(thm.mEventArr);

                    if (df_Intersects.length > 0 && df_Intersects[0].object._mhover == undefined) {
                        df_Intersects[0].object._mhover = true;
                    }

                    if (df_Intersects[0] && df_Intersects[0].object._mhover) {
                        var _obj = df_Intersects[0].object;
                        if (_obj._isShape && _obj._mhover) {

                            var _id = _obj._path_id;

                            if (df_SltMesh) {
                                if (df_SltMesh == _obj.children[0]) {

                                    df_SltMesh._selected = !df_SltMesh._selected;

                                    df_SltMesh._selected ? _Collects.mouseMoveIn(df_SltMesh) : _Collects.mouseMoveOut(df_SltMesh);
                                    thm.selectOptins = df_SltMesh._selected ? {
                                            type: false,
                                            params: $.extend(true, {}, thm.SVGMapObj[_id])
                                        } : null;

                                } else {

                                    df_SltMesh._selected = false;

                                    _Collects.mouseMoveOut(df_SltMesh);
                                    df_SltMesh = null;

                                    df_SltMesh = _obj.children[0];
                                    df_SltMesh._selected = true;
                                    _Collects.mouseMoveIn(df_SltMesh);

                                    thm.selectOptins = {
                                        type: true,
                                        params: $.extend(true, {}, thm.SVGMapObj[_id])
                                    };
                                }

                            } else {
                                df_SltMesh = _obj.children[0];
                                df_SltMesh._selected = true;
                                _Collects.mouseMoveIn(df_SltMesh);

                                thm.selectOptins = {
                                    type: false,
                                    params: $.extend(true, {}, thm.SVGMapObj[_id])
                                };
                            }

                            df_MouseDownCallback(
                                _id, transCoord(_obj._center),
                                $.extend(true, {}, thm.SVGMapObj[_id]),
                                $.extend(true, {}, thm.SVGMapData), event
                            );
                            //-
                            if (df_Config.controls.blockMouseDown == 1 && df_tAnim.type != 1) {
                                df_onAnim = true;
                                df_tAnim.SId = 0;
                                df_tAnim.type = 1;
                                df_tAnim.node = null;
                                df_tAnim.showArr = [];
                                df_tAnim.transTimes = 0;
                                df_tAnim.id[0] = _id;
                                df_tAnim.id[1] = null;
                            }
                            if (thm.pointMap) thm.pointMap._mouseDown();
                            if (thm.migrateMap) thm.migrateMap._mouseDown();
                        }

                        if (_obj._isBackLabels && thm.pointMap) {
                            thm.pointMap._mouseDown(df_Intersects, event);
                            if (df_SltMesh){
                                df_SltMesh._selected = false;
                                _Collects.mouseMoveOut(df_SltMesh);
                            }
                            if (thm.migrateMap) thm.migrateMap._mouseDown();
                        }
                        if (_obj._isMigMapBackLabels && thm.migrateMap) {
                            thm.migrateMap._mouseDown(df_Intersects, event);
                            if (df_SltMesh){
                                df_SltMesh._selected = false;
                                _Collects.mouseMoveOut(df_SltMesh);
                            }
                            if (thm.pointMap) thm.pointMap._mouseDown();
                        }
                        if (_obj._isMLine && thm.migrateMap) {
                            thm.migrateMap._mouseDown(df_Intersects, event);
                            if (df_SltMesh){
                                df_SltMesh._selected = false;
                                _Collects.mouseMoveOut(df_SltMesh);
                            }
                            if (thm.pointMap) thm.pointMap._mouseDown();
                            df_tAnim.id[0] = df_tAnim.id[1] = null;
                            for (var j = thm.shapesArrLen - 1; j >= 0; j--) {
                                var shpi = thm.shapesArr[j];

                                if (_obj._startArea == shpi._name) {
                                    df_tAnim.id[0] = shpi._path_id;
                                }
                                if (_obj._endArea == shpi._name) {
                                    df_tAnim.id[1] = shpi._path_id;
                                }
                            }
                            if (df_Config.controls.blockMouseDown == 1 && df_tAnim.id[0] && df_tAnim.id[1]) {
                                //-
                                if (df_tAnim.type != 1) {
                                    df_onAnim = true;
                                    df_tAnim.SId = 0;
                                    df_tAnim.type = 1;
                                    df_tAnim.node = _obj;
                                    df_tAnim.showArr = [];
                                    df_tAnim.transTimes = 0;
                                }
                            }
                        }
                        //- by LiLingLing on time 2019/7/23 添加
                        if (_obj._isColumnar && thm.columnarMap) {
                            thm.columnarMap._mouseDown( _obj, event );
                        }
                    } else {

                        if (df_SltMesh) {
                            df_SltMesh._selected = false;
                            _Collects.mouseMoveOut(df_SltMesh);
                            df_SltMesh = null;
                        }
                        thm.selectOptins = null;
                        if (df_Config.controls.blockMouseDown == 1 && df_tAnim.type == 1 && !df_onAnim) {
                            df_onAnim = true;

                            df_tAnim.SId = 0;
                            df_tAnim.type = 2;
                            df_tAnim.node = null;
                            df_tAnim.showArr = [];
                            df_tAnim.transTimes = 0;
                        }
                        df_MouseDownCallback(false);
                        if (thm.pointMap) thm.pointMap._mouseDown();
                        if (thm.migrateMap) thm.migrateMap._mouseDown();

                        if (thm.columnarMap)thm.columnarMap._mouseDown();
                    }
                }
            }, 200);
        }
        /**
         * [onDocumentMousedblclick 鼠标双击事件方法]
         * @Author   ZHOUPU
         * @DateTime 2018-08-02
         * @param    {[type]}   event [事件event]
         * @return   {[void]}
         */
        function onDocumentMousedblclick(event) {
            event.preventDefault();
            clearTimeout(df_dbClickDelay);
            if (thm._animation) {
                df_Mouse.x = (event.layerX / df_Width) * 2 - 1;
                df_Mouse.y = -(event.layerY / df_Height) * 2 + 1;
                df_Raycaster.setFromCamera(df_Mouse, thm.camera);
                df_Intersects = df_Raycaster.intersectObjects(thm.mEventArr);

                if (df_Intersects.length > 0 && df_Intersects[0].object._mhover == undefined) {
                    df_Intersects[0].object._mhover = true;
                }

                if (df_Intersects[0] && df_Intersects[0].object._mhover) {
                    var _obj = df_Intersects[0].object;
                    if (df_Config.controls.blockMouseDown == 2 && _obj._isShape && _obj._mhover) {
                        //-
                        if (df_tAnim.type != 1) {
                            df_onAnim = true;
                            df_tAnim.SId = 0;
                            df_tAnim.type = 1;
                            df_tAnim.node = null;
                            df_tAnim.showArr = [];
                            df_tAnim.transTimes = 0;
                            df_tAnim.id[0] = _obj._path_id;
                            df_tAnim.id[1] = null;
                        }
                    }
                    if (_obj._isMLine && thm.migrateMap) {
                        df_tAnim.id[0] = df_tAnim.id[1] = null;
                        for (var j = thm.shapesArrLen - 1; j >= 0; j--) {
                            var shpi = thm.shapesArr[j];

                            if (_obj._startArea == shpi._name) {
                                df_tAnim.id[0] = shpi._path_id;
                            }
                            if (_obj._endArea == shpi._name) {
                                df_tAnim.id[1] = shpi._path_id;
                            }
                        }
                        if (df_Config.controls.blockMouseDown == 2 && df_tAnim.id[0] && df_tAnim.id[1]) {
                            //-
                            if (df_tAnim.type != 1) {
                                df_onAnim = true;
                                df_tAnim.SId = 0;
                                df_tAnim.type = 1;
                                df_tAnim.node = _obj;
                                df_tAnim.showArr = [];
                                df_tAnim.transTimes = 0;
                            }
                        }
                    }
                } else {
                    if (df_Config.controls.blockMouseDown == 2 && df_tAnim.type == 1 && !df_onAnim) {
                        df_onAnim = true;

                        df_tAnim.SId = 0;
                        df_tAnim.type = 2;
                        df_tAnim.node = null;
                        df_tAnim.showArr = [];
                        df_tAnim.transTimes = 0;
                    }
                }
            }
        }
        /**
         * [onContResize 容器重置大小方法]
         * @Author   ZHOUPU
         * @DateTime 2018-08-02
         * @param    {[number]}   w [容器宽度值]
         * @param    {[number]}   h [容器高度值]
         * @return   {[void]}
         */
        function onContResize(w, h) {
            var wh = getWH();
            df_Width = _Collects.clamp(w * 1, 0, Infinity, wh.w);
            df_Height = _Collects.clamp(h * 1, 0, Infinity, wh.h);

            thm.camera.aspect = df_Width / df_Height;
            thm.renderer.setSize(df_Width, df_Height);
            thm.camera.updateProjectionMatrix();

            !thm._animation && thm.renderer.render(thm.scene, thm.camera);
        }

        //- renderer
        /**
         * [renderers 渲染方法，帧动画入口，控制是否有动画&销毁渲染器]
         * @Author   ZHOUPU
         * @DateTime 2018-08-02
         * @return   {[void]}
         */
        function renderers() {
            (function Animations() {
                if (thm.is_Init) {
                    df_raf = global.requestAnimationFrame(Animations);
                    if (thm._animation) {
                        var delta = df_Clock.getDelta();
                        if (delta > 0) animation(delta);

                        thm.controls.update();
                        thm.renderer.render(thm.scene, thm.camera);
                    }
                } else {
                    df_raf && global.cancelAnimationFrame(df_raf);
                    clearTimeout(df_dbClickDelay);

                    thm.renderer.dispose();
                    thm.renderer.forceContextLoss();
                    thm.renderer.domElement = null;

                    disposeScene();
                    removeEvents();
                    thm.controls.dispose();
                    thm.container.remove();
                    disposeValue();
                }
            })();
        }

        //-
        // 判断renderer 是否是THREE的WebGLRenderer对象
        function testing() {
            return thm.renderer instanceof THREE.WebGLRenderer;
        }

        // 获取容器宽高值
        function getWH() {
            return {
                w: thm.parentCont.width(),
                h: thm.parentCont.height()
            };
        }
        /**
         * [setControls 设置控制器功能]
         * @Author   ZHOUPU
         * @DateTime 2018-08-02
         * @param    {[object]}   controls [控制器对象]
         * @param    {[object]}   opts     [控制器参数 缩放、旋转、平移]
         * @param    {Boolean}  isInit   [是否初始化]
         */
        function setControls(controls, opts, isInit) {

            controls.enablePan = opts.enablePan;
            controls.enableKeys = opts.enablePan;
            controls.enableZoom = opts.enableZoom;
            controls.enableRotate = opts.enableRotate;

            if (isInit) {
                var _opts = default_Config.controls;

                controls.enableDamping = _opts.enableDamping;
                controls.dampingFactor = _opts.dampingFactor;

                controls.panSpeed = _opts.panSpeed;
                controls.zoomSpeed = _opts.zoomSpeed;
                controls.rotateSpeed = _opts.rotateSpeed;

                controls.minDistance = _opts.distance[0];
                controls.maxDistance = _opts.distance[1];
                controls.minPolarAngle = _opts.polarAngle[0];
                controls.maxPolarAngle = _opts.polarAngle[1];
                controls.minAzimuthAngle = _opts.azimuthAngle[0];
                controls.maxAzimuthAngle = _opts.azimuthAngle[1];
            }
        }
        /**
         * [setControlsOff 关闭控制器 缩放、旋转、平移 功能]
         * @Author   ZHOUPU
         * @DateTime 2018-08-02
         * @param    {[object]}   controls [控制器对象]
         */
        function setControlsOff(controls) {
            controls.enablePan = false;
            controls.enableKeys = false;
            controls.enableZoom = false;
            controls.enableRotate = false;
        }
        /**
         * [setLight 设置场景灯光]
         * @Author   ZHOUPU
         * @DateTime 2018-08-02
         * @param    {[object]}   scene [场景对象]
         * @param    {[object]}   opts  [灯光参数- 类别、颜色、光强]
         */
        function setLight(scene, opts) {
            scene.add(new THREE.AmbientLight(opts.Ambient.color, opts.Ambient.strength));
            if (opts.isHemisphere) {
                var lh = opts.hemisphere,
                    hLight = new THREE.HemisphereLight(lh.color, lh.groundColor, lh.strength);
                hLight.position.set(lh.position[0], lh.position[2], lh.position[1]);
                scene.add(hLight);
            }
            if (opts.isDirectional) {
                var ld = opts.directional,
                    dlight = new THREE.DirectionalLight(ld.color, ld.strength);
                dlight.position.set(ld.position[0], ld.position[2], ld.position[1]).normalize();
                scene.add(dlight);
            }
        }
        /**
         * [detector 检测是否支持webgl]
         * @Author   ZHOUPU
         * @DateTime 2018-08-02
         * @return   {[Boolean]}   [true-支持、false-不支持]
         */
        function detector() {
            try {
                return !!global.WebGLRenderingContext;
            } catch (e) {
                return false;
            }
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
        /**
         * [parseCts 获取容器dom]
         * @Author   ZHOUPU
         * @DateTime 2018-08-02
         * @param    {[object/string]}   cts [容器dom/容器id]
         * @return   {[object/null]}       [容器dom/null值]
         */
        function parseCts(cts) {
            var $dom = (typeof cts == 'object') ? $(cts) : $('#' + cts);
            if ($dom.length <= 0) return null;
            return $dom;
        }

        //- dispose
        /**
         * [removeEvents 移除绑定的鼠标移入和点击事件]
         * @Author   ZHOUPU
         * @DateTime 2018-08-02
         * @return   {[void]}
         */
        function removeEvents() {
            thm.container[0].removeEventListener('mouseout', onDocumentMouseOut, false);
            thm.container[0].removeEventListener('mousemove', onDocumentMouseMove, false);
            thm.container[0].removeEventListener('mousedown', onDocumentMouseDown, false);
            thm.container[0].removeEventListener('dblclick', onDocumentMousedblclick, false);
        }
        /**
         * [deleteLayerMap 根据图层id删除图层对象]
         * @Author   ZHOUPU
         * @DateTime 2018-08-11
         * @param    {[number]}   index    [图层id]
         * @param    {Boolean}  isChange [是否是更改图层——删除图层对象，保留id位置]
         * @return   {[void]}
         */
        function deleteLayerMap(index, isChange) {
            index = parseInt(index);
            isChange = !!isChange;
            // 删除事件数组
            for (var i = thm.mEventArr.length - 1; i >= 0; i--) {
                var child = thm.mEventArr[i];
                if (child.LayerID == index) {
                    thm.mEventArr.splice(i, 1);
                }
            }
            // 删除图层对象
            if (thm.SVGMapLayers) {
                thm.SVGMapLayers.children.forEach(function(layer) {
                    if (layer.LayerID == index) {
                        disposeObj(layer);
                        thm.SVGMapLayers.remove(layer);
                        layer = null;
                    }
                });
                if (!isChange) {
                    thm.SVGMapLayers.traverse(function(child) {
                        if (child.LayerID && child.LayerID > index) child.LayerID--;
                    });
                }
            }
        }
        /**
         * [disposeScene 销毁场景&场景用到的变量和对象]
         * @Author   ZHOUPU
         * @DateTime 2018-08-02
         * @return   {[void]}
         */
        function disposeScene() {
            //-
            df_Config = null;
            df_AdmisDic = null;
            _Shaders = null;
            _Materials = null;
            _Geometries = null;
            _Collects = null;

            thm.CoordTrans = null;
            thm._TxueLoader = null;
            thm._df_Tdata = null;
            thm.mEventArr = null;

            thm.SVGMapLayers = null;
            thm.LayersArray = null;
            thm.pointMap = null;
            thm.migrateMap = null;

            thm.SVGMapObj = null;
            thm.SVGMapData = null;
            thm.shapesArr = null;
            thm.mapObject = null;

            df_Mouse = null;
            df_ItdMesh = null;
            df_SltMesh = null;
            df_Raycaster = null;
            df_Intersects = null;
            df_animationArr = null;
            df_MouseDownCallback = null;
            df_MouseDoubleClickCallback = null;
            df_MouseHoverCallback = null;

            disposeObj(thm.scene);
        }
        /**
         * [disposeObj 销毁对象，解绑与GPU的联系，删除子对象，释放内存]
         * @Author   ZHOUPU
         * @DateTime 2018-08-02
         * @param    {[object]}   obj [待销毁的object3D对象]
         * @return   {[void]}
         */
        function disposeObj(obj) {
            if (obj instanceof THREE.Object3D) {

                objectTraverse(obj, function(child) {

                    if (child._txueArr) {
                        child._txueArr[1].dispose();
                        child._txueArr[2].dispose();
                        child._txueArr[1] = null;
                        child._txueArr[2] = null;
                    }
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
         * [disposeValue 销毁变量]
         * @Author   ZHOUPU
         * @DateTime 2018-08-02
         * @return   {[void]}
         */
        function disposeValue() {

            thm.scene = null;
            thm.camera = null;
            thm.renderer = null;
            thm.controls = null;
            thm.container = null;
            thm.parentCont = null;

            thm = null;
            renderers = null;
            df_OnRenderCallback = null;
        }

        // vec3 to vec2
        /**
         * [transCoord 三维世界坐标转屏幕二维坐标]
         * @Author   ZHOUPU
         * @DateTime 2018-08-02
         * @param    {[object]}   position [三维世界坐标- vector3]
         * @return   {[object]}            [屏幕二维坐标，位置基于容器]
         */
        function transCoord(position) {
            var halfW = df_Width / 2,
                halfH = df_Height / 2,
                vec3 = position.clone().applyMatrix4(thm.scene.matrix).project(thm.camera),
                mx = Math.round(vec3.x * halfW + halfW),
                my = Math.round(-vec3.y * halfH + halfH);
            return new THREE.Vector2(mx, my);
        }

        this.transCoord3dTo2d = transCoord;

        // Container
        /**
         * [creatContainer 根据id创建dom容器]
         * @Author   ZHOUPU
         * @DateTime 2018-08-02
         * @param    {[string]}   id [容器id]
         * @return   {[object]}      [容器dom对象]
         */
        function creatContainer(id) {
            var containers = $('<div></div>');
            containers.css("cssText", "height:100%;width:100%;overflow:hidden;position:relative !important");
            containers.attr('id', id);
            return containers;
        }
        /**
         * [creatError 创建错误提示]
         * @Author   ZHOUPU
         * @DateTime 2018-08-02
         * @param    {[object]}   conts     [错误提示容器dom对象]
         * @param    {[string]}   errorText [错误提示内容]
         * @return   {[void]}
         */
        function creatError(conts, errorText) {
            var error = $('<div class="data-error"></div>'),
                error_text = errorText || '数据错误。。。';
            if (undefined != conts) {
                var ctxt = "color:#fff;position:absolute;top:49%;width:100%;text-align:center;";
                error.css("cssText", ctxt);
                conts.html(error.html(error_text));
            }
        }

    };

    /**
     * [CoordTrans 经纬度转换类]
     * @Author   ZHOUPU
     * @DateTime 2018-07-28
     */
    var CoordTrans = function() {
        /**
         * [mercatorRatio 默认转换参数]
         * @type {Array}
         */
        this.mercatorRatio = [
            [0, 1, 0],
            [0, 0, 1]
        ];
        /**
         * [init 经纬度转换初始化]
         * @Author   ZHOUPU
         * @DateTime 2018-07-28
         * @param    {[array]}   jwOpts [经纬度数组] [ [j,w], [], [] ]
         * @param    {[array]}   xyOpts [平面坐标数组] [ [ x,y], [], [] ]
         * @return   {[void]}
         */
        this.init = function(jwOpts, xyOpts) {

            if (jwOpts.length < 3 || xyOpts.length < 3) {
                return;
            }
            var defaultMapData = {
                WTCoords: [],
                XYCoords: []
            };

            for (var i = 0; i < 3; i++) {
                defaultMapData.WTCoords.push({
                    W: jwOpts[i][0] * 1,
                    T: jwOpts[i][1] * 1
                });
                defaultMapData.XYCoords.push({
                    X: xyOpts[i][0] * 1,
                    Y: xyOpts[i][1] * 1
                });
            }
            initRelativeCoorRatio(defaultMapData);
        };
        /**
         * [transCoord 转换方法]
         * @Author   ZHOUPU
         * @DateTime 2018-07-28
         * @param    {[number]}   lng [经度值]
         * @param    {[number]}   lat [纬度值]
         * @return   {[array]}       [转换后的坐标]
         */
        this.transCoord = function(lng, lat) {
            var mrt = _Cot.mercatorRatio;
            var x = mrt[0][0] + mrt[0][1] * lng + mrt[0][2] * lat;
            var y = mrt[1][0] + mrt[1][1] * lng + mrt[1][2] * lat;
            return [x, y];
        }

        var _Cot = this;
        /**
         * [initRelativeCoorRatio 计算转换参数方法]
         * @Author   ZHOUPU
         * @DateTime 2018-07-28
         * @param    {[object]}   opts [初始化后经纬度和平面坐标对象]
         * @return   {[void]}
         */
        function initRelativeCoorRatio(opts) {
            var lonlat = opts.WTCoords;
            var xy = opts.XYCoords;

            var lon0 = lonlat[0].W,
                lat0 = lonlat[0].T,
                lon1 = lonlat[1].W,
                lat1 = lonlat[1].T,
                lon2 = lonlat[2].W,
                lat2 = lonlat[2].T;

            var key1 = (lon0 - lon1),
                key2 = (lat0 - lat1),
                key3 = (lat0 - lat1) * (lon0 - lon2) - (lat0 - lat2) * (lon0 - lon1);

            if (key1 == 0) {
                key1 = (lon0 - lon2);
                key2 = (lat0 - lat2);
            }
            if (key1 == 0) {
                key1 = (lon1 - lon2);
                key2 = (lat1 - lat2);
            }

            if (key3 == 0 || key1 == 0) {
                return;
            }

            var x0 = xy[0].X,
                y0 = xy[0].Y,
                x1 = xy[1].X,
                y1 = xy[1].Y,
                x2 = xy[2].X,
                y2 = xy[2].Y;

            var a2 = ((x0 - x1) * (lon0 - lon2) - (x0 - x2) * (lon0 - lon1)) / key3;
            var a1 = ((x0 - x1) - a2 * key2) / key1;
            var a0 = x0 - lon0 * a1 - lat0 * a2;

            var b2 = ((y0 - y1) * (lon0 - lon2) - (y0 - y2) * (lon0 - lon1)) / key3;
            var b1 = ((y0 - y1) - b2 * key2) / key1;
            var b0 = y0 - lon0 * b1 - lat0 * b2;

            _Cot.mercatorRatio[0] = [a0, a1, a2];
            _Cot.mercatorRatio[1] = [b0, b1, b2];
        }

    };

    global.svgInitialize_LLL = svgInitialize_LLL;

})( typeof window !== 'undefined'? window: this, jQuery, document );
