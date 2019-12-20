/**
 * Created by SF3298 on 2019/8/29.
 */

var global = window;
//- 时间河流
var TimeRiverInitialize = function(){

    //- 容器
    this.GId = '';
    this.container;
    this.parentCont;
    this.Result = false;
    this.is_Init = false;
    //-
    this.scene;
    this.camera;
    this.renderer;
    //-
    this.meshObjs = null;

    /**
     * [init 初始化接口]
     * @Author   LiLingLIng
     * @DateTime 2019/8/29
     * @param    {[string/object]}   cts    [容器id或者容器dom对象]
     * @param    {[object]}   config [配置参数]
     * @return   {[void/error]}          [初始化错误返回错误提示]
     */
    this.init = function ( cts, config ) {
        var conts = parseCts(cts);
        if (detector() && conts != null) {
            try {
                var config = config || {};
                df_Config = $.extend(true, {}, default_Config, config);
                thm.parentCont = conts;
                thm.GId += THREE.Math.generateUUID();
                var TId = conts.attr('id') + '_' + thm.GId;
                thm.container = creatContainer(TId);
                thm.parentCont.html(thm.container);

                initiate();
                thm.is_Init = true;

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
    /**
     * [disposeRender 销毁整个时间河流组件接口]
     * @Author   LiLingLIng
     * @DateTime 2019/8/29
     * @return   {[void]}
     */
    this.disposeRender = function() {
        if (thm.is_Init && testing()) {
            thm.is_Init = false;
        }
    };

    //渲染或者解析错误回调接口
    this.onError = function(func) {
        df_ErrorCallback = toFunction(func);
    };

    //- 时间河流对象
    var thm = this;
    //内部变量
    var df_Clock,df_raf,df_Width = 0, df_Height = 0;
    //- callback
    var df_ErrorCallback = toFunction();
    //- default setting
    var df_Config = {};
    var default_Config = {
        background: {
            color: '#000000', //背景色
            opacity: 0 //背景透明度
        },
        camera: { //相机
            near: 0.1,
            far: 1000,
            position: [0, 0, 50]
        },
        flow: {//流动粒子参数
            count: 10,//粒子密度
            size: 1,//粒子大小
            color: '#CAFFFF',//粒子颜色
            opacity: 1.0,
            raidus: 2,
            vec3: { x: -1, y: 0, z: 0 },
            ratio4: { x: 'x', xr: 0.1,  y: 'y', yr: 1.0 }
        },
        belt: {//流动彩带参数
            color: '#B4FDE9',//颜色
            count: 1,
            sizeY: 0.01,
            opacity: 1
        }
    };
    /**
     * [_dfTdata 默认常量]
     * @type {Object}
     */
    var _dfTdata = {
        M_PI: 6.2831853071795865,
        M_PI2: 1.57079632679489662
    };

    //- 着色器管理
    var _Shaders = {
        FlowVShader: [
            "uniform float size; ",
            "uniform float time; ",
            "uniform vec3 color; ",
            "uniform float opacity; ",

            "attribute float cSize; ",
            "attribute float cRatio; ",

            "varying vec4 vColor; ",

            "void main() { ",
            "float k = cRatio - time; ",
            "if ( time >= cRatio ) k += 1.0; ",

            "float c = k<0.1? k*10.0: k>0.9? (1.0-k)*10.0: 1.0; ",
            "vColor = vec4( color, opacity * c ); ",

            "float px = position.x * ( k * 2.0 - 1.0); ",
            "float py = position.y + 0.55*position.y * cos( k*18.0+2.0 ); ",
            "vec4 mP = modelViewMatrix * vec4( px, py, position.z, 1.0 ); ",
            "gl_PointSize = size * cSize * 512.0/(-mP.z); ",

            "gl_Position = projectionMatrix * mP; ",
            "} "
        ].join("\n"),
        BeltInstancedVShader: [
            "attribute float wRatio;",//线宽比列
            "attribute vec4 color;",

            "uniform vec2 size;",

            "varying vec3 vPosition; ",
            "varying vec4 vColor; ",
            "varying float vRatio; ",

            "void main() { ",
            "vPosition = position;",
            "vColor = color;",
            "vRatio = wRatio;",

            "vec3 mPosition = vec3(position.x*size.x, position.y*size.y, position.z);",
            "gl_Position = projectionMatrix * modelViewMatrix * vec4( mPosition, 1.0 );",
            "} "
        ].join("\n"),

        FlowFShader: [
            "uniform sampler2D u_txue; ",
            "varying vec4 vColor; ",
            "void main() { ",
            "gl_FragColor = vColor * texture2D(u_txue, gl_PointCoord)*2.5; ",
            "} "
        ].join("\n"),
        BeltInstancedFShader: [
            "uniform float time; ",
            "uniform float sizeY; ",

            "varying vec3 vPosition; ",
            "varying vec4 vColor; ",
            "varying float vRatio; ",

            "void main() { ",

            "float ty = (0.14*vRatio+0.08)*sin((vPosition.x+vRatio)*5.0+time*1.6); ",//0.08-0.22

            "float disW = abs(vPosition.x);",

            //-
            "float disY = abs(vPosition.y-ty);",
            "float insY = disY>=sizeY?0.0:pow(1.0-disY/sizeY,2.0);",

            //- 0.2
            "float disX = disW-0.3;",
            "float insX = disX>0.0?pow(1.0-disX/0.2,1.0):1.0;",

            "vec4 color = vec4(vColor.rgb,vColor.a*insY*insX);",
            "gl_FragColor = color;",
            "} "
        ].join("\n")
    };
    var _Collects = {
        obj: function () { return new THREE.Object3D(); },
        color: function ( c ) { return new THREE.Color(c); },
        /**
         * [randomCircle 在圆中获取随机数]
         * @Author   LiLingLIng
         * @DateTime 2019/8/31
         * @param base [Vector3] 圆的中心点
         * @param raidus [number] 半径
         * @param vec4
         * @param ratio
         * @returns {[Vector3]}     随机点
         */
        randomCircle: function ( base, raidus, vec4, ratio ) {
            var t = _dfTdata.M_PI * Math.random();
            var vec3 = new THREE.Vector3();
            vec3[vec4.x] = Math.cos(t) * vec4.xr;
            vec3[vec4.y] = Math.sin(t) * vec4.yr;
            if ( ratio ) { return new THREE.Vector3().addVectors(base, vec3.multiplyScalar(ratio._k));
            } else return new THREE.Vector3().addVectors(base, vec3.multiplyScalar(raidus));
        },
        //- 流动粒子
        creatFlow: function () {

            var opts = df_Config.flow;
            //- Material
            var mtl = _Materials.shader({
                uniforms: {
                    u_txue: { value: (new THREE.TextureLoader()).load(opts.path) },
                    opacity: { value: opts.opacity },
                    size: { value: opts.size },
                    color: { value: _Collects.color( opts.color ) },
                    time: { value: 0.0 }
                },
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                vertexShader: _Shaders.FlowVShader,
                fragmentShader: _Shaders.FlowFShader
            });
            //- Geometry
            var geo = _Geometries.buf();
            var rCount = opts.count,
                rBGeoSize = new Float32Array( rCount ),
                rBGeoRatio = new Float32Array( rCount ),
                rBGeoPosition = new Float32Array( rCount * 3 );

            var _b = new THREE.Vector3(opts.vec3.x, opts.vec3.y, opts.vec3.z), _r = opts.raidus, _v4 = opts.ratio4;
            for ( var i=0; i<rCount; i++ ) {
                var k = Math.random();
                rBGeoSize[i] = Math.min(5, 1/k);
                rBGeoRatio[i] = Math.random();
                _Collects.randomCircle( _b, _r, _v4, {_k: k*_r} ).toArray( rBGeoPosition, i*3 );
            }
            geo.addAttribute( 'cSize', new THREE.BufferAttribute( rBGeoSize, 1 ) );
            geo.addAttribute( 'cRatio', new THREE.BufferAttribute( rBGeoRatio, 1 ) );
            geo.addAttribute( 'position', new THREE.BufferAttribute( rBGeoPosition, 3 ) );
            //-
            var flow = new THREE.Points(geo, mtl);
            flow.renderOrder = 1;
            flow._transTimes = 0;
            flow._perTimes = opts.perTimes;
            flow._animation = true;

            return flow;
        },
        //- 流动彩带
        creatBelt: function ( opts ) {

            var vertices = [-0.5,0.5,0, -0.5,-0.5,0, 0.5,-0.5,0, 0.5,0.5,0],
                indices = [0,1,2, 2,3,0];

            var geo = _Geometries.insBuf();
            geo.setIndex(indices);
            geo.addAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
            //- wRatio/color
            var wRatios = [],colors = [],len=opts.count, isOff = opts.offsetY.length>0;
            var tCol = _Collects.color(opts.color);

            for(var i=0;i<len;i++){
                var ra = isOff? opts.offsetY[i]: 2*Math.random();
                wRatios.push(ra);
                colors.push(tCol.r,tCol.g,tCol.b,1.0);
            }
            !isOff&&console.log(wRatios);

            geo.addAttribute( 'wRatio', new THREE.InstancedBufferAttribute( new Float32Array( wRatios ), 1 ) );
            geo.addAttribute( 'color', new THREE.InstancedBufferAttribute( new Float32Array( colors ), 4 ) );
            geo.maxInstancedCount = opts.count;

            var mtl = _Materials.shader({
                uniforms: {
                    size: { value: new THREE.Vector2(2,1.7) },
                    time: { value: 0.0 },
                    sizeY: { value: opts.sizeY }
                },
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                vertexShader: _Shaders.BeltInstancedVShader,
                fragmentShader: _Shaders.BeltInstancedFShader
            });

            return new THREE.Mesh( geo, mtl );
        }
    };
    //- 材质管理
    var _Materials = {
        basic: function ( param ) { return new THREE.MeshBasicMaterial( param ); },
        point: function( param ) { return new THREE.PointsMaterial( param ); },
        line: function( param ) { return new THREE.LineBasicMaterial( param ); },
        shader: function ( param ) { return new THREE.ShaderMaterial( param ); }
    };
    //- 几何对象管理
    var _Geometries = {
        geo: function () { return new THREE.Geometry(); },
        buf: function () { return new THREE.BufferGeometry(); },
        insBuf: function() {return new THREE.InstancedBufferGeometry();},
        plane: function(w, h, ws, hs) { return new THREE.PlaneGeometry(w, h, ws, hs); }
    };
    /**
     * [initiate 初始化场景、相机、渲染器、事件等]
     * @Author   LiLingLIng
     * @DateTime 2019/8/29
     * @return   {[void]}
     */
    function initiate() {

        df_Clock = new THREE.Clock();
        thm.scene = new THREE.Scene();
        //- 宽高
        var wh = getWH();
        df_Width = wh.w;
        df_Height = wh.h;
        //-
        var cm = df_Config.camera,
            bg = df_Config.background;
        //- camera
        thm.camera = new THREE.OrthographicCamera( -1,1,1,-1, cm.near, cm.far );
        thm.camera.position.set( cm.position[0], cm.position[1], cm.position[2] );
        thm.camera.lookAt( thm.scene.position );
        //- renderer
        thm.renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
        thm.renderer.setSize( df_Width, df_Height );
        thm.renderer.setClearColor( bg.color, bg.opacity );
        thm.container.append( $(thm.renderer.domElement) );

        //-
        thm.meshObjs = _Collects.obj();
        thm.scene.add( thm.meshObjs );

        //-
        init3DMesh();
    }
    /**
     * [init3DMesh 初始时间河流]
     * @Author   LiLingLIng
     * @DateTime 2019/8/29
     * @return   {[void]}
     */
    function init3DMesh() {
        //- 粒子
        var flow = _Collects.creatFlow();
        //- 线条样式
        var _bConfig = df_Config.belt;
        var belt = _Collects.creatBelt(_bConfig);
        belt._animaBelt = true;
        thm.meshObjs.add( belt, flow);
    }

    /**
     * [renderers 渲染方法，帧动画入口，控制是否有动画&销毁渲染器]
     * @Author   LiLingLIng
     * @DateTime 2019/8/29
     * @return   {[void]}
     */
    function renderers() {
        (function Animations() {
            if (thm.is_Init) {
                df_raf = global.requestAnimationFrame(Animations);

                var delta = df_Clock.getDelta();
                if (delta > 0) animation(delta);

                thm.renderer.render(thm.scene, thm.camera);
            } else {
                df_raf && global.cancelAnimationFrame(df_raf);

                disposeScene();
            }
        })();
    }
    /**
     * [animation 场景所有动画入口方法]
     * @Author   LiLingLIng
     * @DateTime 2019/8/29
     * @param    {[number]}   dt [帧时长]
     * @return   {[void]}
     */
    function animation(dt) {
        thm.meshObjs.traverse( function( child ) {
            if ( child._animation ) {//粒子运动
                var _times = child._perTimes; child._transTimes += dt;
                child.material.uniforms.time.value = child._transTimes/_times;
                if (child._transTimes >= _times) child._transTimes -= _times;
            }else if(child._animaBelt){//彩带运动
                child.material.uniforms.time.value = df_Clock.elapsedTime;
            }
        });
    }
    /**
     * [disposeScene 销毁场景&场景用到的变量和对象]
     * @Author   LiLingLIng
     * @DateTime 2019/8/29
     * @return   {[void]}
     */
    function disposeScene() {
        //-
        thm.renderer.dispose();
        thm.renderer.forceContextLoss();
        thm.renderer.domElement = null;
        thm.renderer.context = null;

        thm.container.remove();
        //-
        df_Config = null;
        default_Config = null;

        //-
        _Shaders = null;
        _Materials = null;
        _Geometries = null;
        _Collects = null;

        thm.meshObjs = null;
        thm.parentCont = null;

        disposeObj(thm.scene);

        thm.scene = null;
        thm.camera = null;
        thm.renderer = null;
        thm.container = null;

        df_Clock = null;
        df_ErrorCallback = null;

        thm = null;
        renderers = null;
    }
    /**
     * [disposeObj 删除组合节点]
     * @Author   LiLingLIng
     * @DateTime 2019/8/29
     * @param    {[object]}   obj [组合节点]
     * @return   {[type]}       [description]
     */
    function disposeObj ( obj ) {
        if ( obj instanceof THREE.Object3D ) {
            objectTraverse( obj, function(node){
                deleteGeometry( node );
                deleteMaterial( node );
                node.dispose && node.dispose();
                if ( node.parent ) node.parent.remove(node);
                node = null;
            } );
        }
    }
    /**
     * [deleteGeometry 删除几何体]
     * @Author   LiLingLIng
     * @DateTime 2019/8/29
     * @param    {[object]}   node [节点对象]
     * @return   {[type]}        [description]
     */
    function deleteGeometry ( node ) {
        if ( node.geometry && node.geometry.dispose ) {
            if ( node.geometry._bufferGeometry ) {
                node.geometry._bufferGeometry.dispose();
            }

            node.geometry.dispose();
            node.geometry = null;
        }
    }
    /**
     * [deleteMaterial 删除材质，多材质]
     * @Author   LiLingLIng
     * @DateTime 2019/8/29
     * @param    {[object]}   node [节点对象]
     * @return   {[type]}        [description]
     */
    function deleteMaterial ( node ) {
        if ( this.isArray( node.material ) ) {
            node.material.forEach(function(mat,index){

                disposeMaterial(mat);
                node.material[index ] = null;
            });
        } else if ( node.material ) {
            disposeMaterial( node.material );
        }
        node.material = null;
    }
    /**
     * [disposeMaterial 销毁材质]
     * @Author   LiLingLIng
     * @DateTime 2019/8/29
     * @param    {[object]}   mtl      [THREE的材质对象]
     * @return   {[void]}
     */
    function disposeMaterial (mtl) {
        if(mtl.uniforms){
            for(var i in mtl.uniforms){
                var uniform = mtl.__webglShader?mtl.__webglShader.uniforms[i]:undefined;
                if (uniform && uniform.value ) {
                    uniform.value.dispose&&uniform.value.dispose();
                    uniform.value = null;
                }
                uniform = mtl.uniforms[i];
                if(uniform.value){

                    uniform.value.dispose&&uniform.value.dispose();
                    uniform.value = null;
                }
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
     * @Author   LiLingLIng
     * @DateTime 2019/8/29
     * @param    {[object]}   obj      [THREE的object3D对象]
     * @param    {Function} callback [回调函数，返回遍历对象]
     * @return   {[void]}
     */
    function objectTraverse (obj, callback) {
        if (!isFunction(callback)) return;
        var children = obj.children;
        for (var i = children.length - 1; i >= 0; i--) {
            objectTraverse(children[i], callback);
        }
        callback(obj);
    }

    /**
     * [isArray 判断是否是一个array]
     * @Author   LiLingLIng
     * @DateTime 2019/8/29
     * @param    {[type]}   o [待判断的参数]
     * @return   {Boolean}    [true-array、false-not array]
     */
    function isArray (o) {
        return Object.prototype.toString.call(o) == '[object Array]';
    }
    /**
     * [isFunction 判断是否是一个function]
     * @Author   LiLingLIng
     * @DateTime 2019/8/29
     * @param    {[type]}   a [待判断的参数]
     * @return   {Boolean}    [false-not function、true-function]
     */
    function isFunction (a) {
        return Object.prototype.toString.call(a) === '[object Function]';
    }
    /**
     * [toFunction 参数不是function转为function，是则返回本身]
     * @Author   LiLingLIng
     * @DateTime 2019/8/29
     * @param    {[type]}   a [待判断的参数]
     * @return   {[function]}     [function]
     */
    function toFunction (a) {
        var b = Object.prototype.toString.call(a) === '[object Function]';
        return b ? a : function(o) {};
    }

    // 获取容器宽高值
    function getWH() {
        return {
            w: thm.parentCont.width(),
            h: thm.parentCont.height()
        };
    }
    // 判断renderer 是否是THREE的WebGLRenderer对象
    function testing() {
        return thm.renderer instanceof THREE.WebGLRenderer;
    }
    /**
     * [creatContainer 根据id创建dom容器]
     * @Author   LiLingLIng
     * @DateTime 2019/8/29
     * @param    {[string]}   id [容器id]
     * @return   {[object]}      [容器dom对象]
     */
    function creatContainer (id) {
        var containers = $('<div></div>');
        // containers.css("cssText", "height:100%;width:100%;overflow:hidden;position:relative !important");
        containers.css("cssText", "height:100%;width:100%;overflow:hidden;position:absolute");
        containers.attr('id', id);
        return containers;
    }
    /**
     * [detector 检测是否支持webgl]
     * @Author   LiLingLIng
     * @DateTime 2019/8/29
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
     * [parseCts 获取容器dom]
     * @Author   LiLingLIng
     * @DateTime 2019/8/29
     * @param    {[object/string]}   cts [容器dom/容器id]
     * @return   {[object/null]}       [容器dom/null值]
     */
    function parseCts(cts) {
        var $dom = (typeof cts == 'object') ? $(cts) : $('#' + cts);
        if ($dom.length <= 0) return null;
        return $dom;
    }

};