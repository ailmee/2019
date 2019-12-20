/**
 * Created by SF3298 on 2018/11/20.
 */

var treeInitialize = function(isClick){

    var isInit,df_anima;
    var thm = this;
    //container;scene;camera;renderer;controls;diverPoint;buildings,object,oneMap
    this.init = function(cts,config){
        var conts = parseCts(cts);
        if ( detector() && conts != null) {
            try {
                var config = config || {};
                df_Config = $.extend( true, {}, df_Config, config );

                thm.parentCont = conts;
                thm.GId += THREE_98.Math.generateUUID();
                var TId = conts.attr('id') +'_'+thm.GId;
                thm.container = creatContainer( TId );
                thm.parentCont.html( thm.container );

                _Collects.loadTexture();
                __setControls();//控制器
                initiate();
                isInit = true;
            } catch (e) {
                creatError(conts);
                return;
            }
        }
    };
    this.render = function () {
        isInit && renderers( );
    };
    this.disposeRender = function () {
        isInit = false;
    };
    this.reset = function(){
        (thm.controls)&&(thm.controls.reset());
    };

    var df_Config = {
        camera: { fov: 45, near: 1, far: 10000, position: [ 0, 10, 100 ] },
        controls: {
            enabled:true, enableZoom:true, enableRotate:true, enablePan: true, screenSpacePanning: false, enablePan_UP: false,
            zoomSpeed: 1, rotateSpeed:1, panSpeed: 1,
            target:[0,0,0], distance:[0,Infinity], polarAngle:[0, Math.PI], azimuthAngle: [-Infinity, Infinity]
        },
        scene:{
            color:0x193288,
            fog:{
                enabled:true,near: 20000, far: 30000
            }
        },
        title:{ color:0xffffff, size:10, font:'隶书'},
        clin_count:100,
        cylin:{ opa_c:1.0, opa_p:1.0, opa_r:1.0 },
        pip:{ r0:0.15, r1:0.4, opa0:0.6, opa1:0.4, space:1.0 },
        point:{ X:[-126,220], Z:[-260,260], Y:40, count:30, moveDis: 50, colors:[0x175ce5,0xffab21] },
        particle:{ count:30, size:26, space:0.4 },
        bloomPass:{ strength:1.5, radius:0.1, threshold:0 },
        anim:{
            duration: 1500,
            position:[152.72962534269067,310.56172762592587,337.9063537911761],
            target:[89.48131454080672,21.787893741307386,2.2980041367552175]
        },
        txues: {}
    };

    //- Common methods
    var _Collects = {

        obj: function () { return new THREE_98.Object3D(); },
        color: function ( c ) { return new THREE_98.Color(c); },

        createScene: function() {

            var scene = new THREE_98.Scene();
            scene.background = new THREE_98.Color( df_Config.scene.color );
            (df_Config.scene.fog.enabled) &&(scene.fog = new THREE_98.Fog( df_Config.scene.fog.color, df_Config.scene.fog.near, df_Config.scene.fog.far ));
            return scene;
        },
        createCamera: function( wh ) {

            var infor = df_Config.camera;
            var camera = new THREE_98.PerspectiveCamera( infor.fov, wh.w / wh.h, infor.near, infor.far );
            camera.position.set( infor.position[0], infor.position[1], infor.position[2] );

            return camera;
        },
        createRenderer: function( w, h ) {

            var renderer = new THREE_98.WebGLRenderer( { antialias: true, alpha: true } );
            renderer.sortObjects = false;
            renderer.setSize( w, h );

            return renderer;
        },
        createControls: function(camera,container){

            var infor = df_Config.controls;

            var controls = new THREE_98.OrbitControls( camera, container );
            controls.target = new THREE_98.Vector3( infor.target[0], infor.target[1], infor.target[2] );

            controls.enabled = infor.enabled;

            controls.enableZoom = infor.enableZoom;controls.zoomSpeed = infor.zoomSpeed;
            controls.enableRotate = infor.enableRotate;controls.rotateSpeed = infor.rotateSpeed;
            controls.enablePan = infor.enablePan;controls.panSpeed = infor.panSpeed;

            controls.screenSpacePanning = infor.screenSpacePanning;
            controls.enablePan_UP = infor.enablePan_UP;
            //缩放距离
            controls.minDistance = infor.distance[0];controls.maxDistance = infor.distance[1];
            controls.minPolarAngle = infor.polarAngle[0];controls.maxPolarAngle = infor.polarAngle[1];
            controls.minAzimuthAngle = infor.azimuthAngle[0];controls.maxAzimuthAngle = infor.azimuthAngle[1];

            controls.update();

            return controls;
        },

        loadTexture: function () {
            // var _n = df_df_Config.texture;
            // var tLoad = new THREE_98.TextureLoader();
            df_Config.txues._spot = _Collects.creatSpotTexture();
            df_Config.txues._circle_0x0000FF = _Collects.creatCircleTexture('0,0,255,');//蓝色
            df_Config.txues._circle1_0xFFAB21 = _Collects.creatCircleTexture('255,171,33,');//黄色
        },
        creatSpotTexture: function ( size, power ) {
            var s = size * 16 || 256, m = power || 2,
                cvs = document.createElement("canvas"),
                ctx = cvs.getContext("2d");
            cvs.width = s; cvs.height = s;
            var i, c = 255, p = s/2, r = s/2,
                grad = ctx.createRadialGradient(p,p,0,p,p,r),
                Cubic = function (k, n) {
                    if (n === 2) return k * k;
                    if (n === 3) return k * k * k;
                    return k;
                };
            for(i=0; i<s; i++) {
                var p1 = (i/(s-1)).toFixed(2) * 1,
                    o = (1 - p1) * 0.8,
                    o1 = Cubic(o, m).toFixed(2),
                    c1 = 'rgba('+c+','+c+','+c+','+o1+')';
                grad.addColorStop(p1, c1);
            }
            ctx.fillStyle = grad;
            ctx.arc( p, p, r, 0, 2*Math.PI );
            ctx.fill();
            var texture = new THREE_98.Texture(cvs);
            texture.needsUpdate = true;
            return texture;
        },
        creatCircleTexture: function ( value,size, power ) {
            var s = size * 16 || 256, m = power || 2,
                cvs = document.createElement("canvas"),
                ctx = cvs.getContext("2d");
            cvs.width = s; cvs.height = s;

            var p = s/2, r = s/2;
            ctx.beginPath();
            var grd=ctx.createRadialGradient(p,p,0,p,p,r);
            grd.addColorStop(0,"white");
            grd.addColorStop(0.2,"rgba("+value+"1.0)");
            grd.addColorStop(0.35,"rgba("+value+"0.2)");
            grd.addColorStop(1,"rgba("+value+"0.15)");
            ctx.fillStyle = grd;
            ctx.arc( p, p, r, 0, 2*Math.PI );
            ctx.fill();
            ctx.closePath();

            ctx.beginPath();
            r /= 4;
            ctx.fillStyle = 'white';
            ctx.arc( p, p, r, 0, 2*Math.PI );
            ctx.fill();
            ctx.closePath();

            var texture = new THREE_98.Texture(cvs);
            texture.needsUpdate = true;
            return texture;
        },
        creatTagsArrTxue: function ( textArr ) {
            var ta = textArr || [], cvs1, ctx1;
            cvs1 = document.createElement("canvas");
            ctx1 = cvs1.getContext("2d");
            ctx1.font = "bold 90px "+df_Config.title.font;

            //-
            var maxLength = ctx1.measureText(ta).width;
            var _w = Math.max( 64, THREE_98.Math.ceilPowerOfTwo(maxLength + 4) );
            cvs1.width = cvs1.height = _w;

            //-
            ctx1.font = "bold 90px "+df_Config.title.font;
            ctx1.textAlign = "center";
            ctx1.textBaseline = "middle";
            ctx1.shadowBlur = 24;
            ctx1.shadowColor = "#000";

            //-
            ctx1.fillStyle = "#FFF";
            ctx1.fillText( ta, _w / 2, _w / 2 );

            var texture = new THREE_98.Texture( cvs1 );
            texture.minFilter = texture.magFilter = THREE_98.LinearFilter;
            texture.needsUpdate = true;

            return texture;
        }

    };
    var _Geometries = {

        geo: function () { return new THREE_98.Geometry(); },
        geoBuf: function () { return new THREE_98.BufferGeometry(); },
        //radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded, thetaStart, thetaLength
        cylinBuf: function ( rT, rB, h, rS, hS, o ) { return new THREE_98.CylinderBufferGeometry(rT, rB, h, rS, hS, o ); },
        //radius, segments, thetaStart, thetaLength
        circleBuf: function ( r, s ) { return new THREE_98.CircleBufferGeometry( r, s ); },
        //innerRadius, outerRadius, thetaSegments, phiSegments, thetaStart, thetaLength
        ringBuf: function ( r0, r1, ts, ps ) { return new THREE_98.RingBufferGeometry( r0, r1, ts, ps ); },
        planeBuf: function ( w, h ) { return new THREE_98.PlaneBufferGeometry( w, h ); }
    };
    var _Materials = {

        sprite: function( param ) { return new THREE_98.SpriteMaterial( param ); },
        point: function( param ) { return new THREE_98.PointsMaterial( param ); },
        basic: function ( param ) { return new THREE_98.MeshBasicMaterial( param ); },
        lambert: function ( param ) { return new THREE_98.MeshLambertMaterial( param ); },
        shader: function ( param ) { return new THREE_98.ShaderMaterial( param ); }
    };
    var _Shaders = {
        //发光
        GlowVShader: [
            "varying vec3  vVertexWorldPosition;",
            "varying vec3  vVertexNormal;",
            "void main(){",
            "vVertexNormal = normalize(normalMatrix * normal);//将法线转换到视图坐标系中",
            "vVertexWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;//将顶点转换到世界坐标系中",
            // set gl_Position
            "gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
            "}"
        ].join("\n"),
        //渐变--半径物体
        GradualChRVShader: [
            "uniform vec3 startPos;//起始位置",
            "uniform float size;//渐变长度",
            "uniform float opacity;",
            "varying float mOpacity;",
            "void main(){",
            "float distance = position.y - startPos.y;",
            "mOpacity = opacity - opacity / size * distance;",
            "gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
            "}"
        ].join("\n"),
        //渐变--点--动画
        pointVShader_move:[
            "varying vec3 mPosition;",
            "varying float vOpacity;",
            "varying float vType;",
            "uniform float u_time;//周期0-1",
            "uniform float u_move;",
            "uniform float size;",
            "attribute float noise;",
            "attribute float type;",
            "void main(){",
            "   vType = type;",
            "   mPosition = position;",
            "   float t = noise + u_time;",
            "   t = t >1.0?(t-1.0):t;",
            "   vec3 mP = vec3(position.x,position.y+t*u_move,position.z);",
            "   vOpacity = sin(3.1415926*t)*1.2;",
            "   vOpacity = vOpacity>1.0?1.0:vOpacity;",
            "   gl_PointSize = size;",
            "   gl_Position = projectionMatrix * modelViewMatrix * vec4(mP, 1.0);",
            "}"
        ].join("\n"),
        //渐变--点--动画
        pointFShader_move:[
            "varying vec3 mPosition;",
            "varying float vOpacity;",
            "varying float vType;",
            "uniform sampler2D map1;",
            "uniform sampler2D map2;",
            "void main(){",
            "   gl_FragColor = vType>0.5? vec4(1.0,1.0,1.0,vOpacity)*texture2D( map1, gl_PointCoord ): vec4(1.0,1.0,1.0,vOpacity)*texture2D( map2, gl_PointCoord );",
            "}"
        ].join("\n"),
        //渐变--平面--动画
        GradualChPVShader_move:[
            "varying vec3 mPosition;",
            "varying float vOpacity;",
            "uniform float u_time;//周期0-1",
            "uniform float u_move;",
            "uniform float u_noise;",
            "void main(){",
            "   mPosition = position;",
            "   float t = u_noise + u_time;",
            "   t = t >1.0?(t-1.0):t;",
            "   vec3 mP = vec3(position.x,position.y+t*u_move,position.z);",
            "   vOpacity = sin(3.1415926*t)*1.2;",
            "   vOpacity = vOpacity>1.0?1.0:vOpacity;",
            "   gl_Position = projectionMatrix * modelViewMatrix * vec4(mP, 1.0);",
            "}"
        ].join("\n"),
        //渐变--平面
        GradualChPVShader: [
            "varying vec3 mPosition;",
            "void main(){",
            "mPosition = position;",
            "gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
            "}"
        ].join("\n"),
        //点粒子
        pointVShader:[
            "attribute float size;",
            "attribute float opacity;",
            "varying float topacity;",
            "void main(){",
            "topacity = opacity;",
            "vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
            "gl_PointSize = size * ( 300.0 / -mvPosition.z );",
            "gl_Position = projectionMatrix * mvPosition;",
            "}"
        ].join("\n"),

        //内发光
        GlowInFShader: [
            "uniform vec3 glowColor;",
            "uniform float coeficient;",
            "uniform float power;",
            "varying vec3 vVertexNormal;",
            "varying vec3 vVertexWorldPosition;",
            "void main(){",
            "vec3 worldCameraToVertex= vVertexWorldPosition - cameraPosition;//世界坐标系中从相机位置到顶点位置的距离",
            "vec3 viewCameraToVertex = (viewMatrix * vec4(worldCameraToVertex, 0.0)).xyz;//视图坐标系中从相机位置到顶点位置的距离",
            "viewCameraToVertex = normalize(viewCameraToVertex);//规一化",
            "float intensity = pow(coeficient + dot(vVertexNormal, viewCameraToVertex), power);",
             "gl_FragColor = vec4(glowColor, ((intensity <= 0.0)?1.0:intensity));",
            "}"
        ].join("\n"),
        //外发光
        GlowOutFShader: [
            "uniform vec3   glowColor;",
            "uniform float coeficient;",
            "uniform float power;",
            "varying vec3  vVertexNormal;",
            "varying vec3  vVertexWorldPosition;",

            "void main(){",
            "vec3 worldVertexToCamera= cameraPosition - vVertexWorldPosition; //世界坐标系中顶点位置到相机位置到的距离",
            "vec3 viewCameraToVertex = (viewMatrix * vec4(worldVertexToCamera, 0.0)).xyz;//视图坐标系中",
            "viewCameraToVertex = normalize(viewCameraToVertex);//规一化",
            "float intensity = pow(coeficient + dot(vVertexNormal, viewCameraToVertex),power);",
            //if(intensity > 0.45){ intensity = 1.0;}
            "gl_FragColor = vec4(glowColor, ((intensity>0.45)?1.0:intensity));",
            "}"
        ].join("\n"),
        //渐变--半径物体
        GradualChRFShader: [
            "uniform vec3 color;",
            "varying float mOpacity;",
            "void main(){",
            "gl_FragColor = vec4(color, mOpacity);",
            "}"
        ].join("\n"),
        //渐变--平面--圆
        GradualChPFShader: [
            "uniform vec3 color;",
            "uniform vec3 center;//中心位置",
            "uniform float size;//渐变长度",
            "uniform float opacity;",
            "varying vec3 mPosition;",
            "void main(){",
            "float dis = distance(mPosition,center);",
            "float mOpacity = dis>size?0.0:opacity * (1.0- dis/size );",
            "gl_FragColor = vec4(color, mOpacity);",
            "}"
        ].join("\n"),
        //渐变--平面1--圆环
        GradualChFPFShader: [
            "uniform vec3 color;",
            "uniform vec3 center;//中心位置",
            "uniform float size;//渐变长度",
            "uniform float iPower;",
            "uniform float oPower;",
            "uniform float opacity;",

            "varying vec3 mPosition;",
            "void main(){",
            "float dis = distance(mPosition,center);",

            // "float mOpacity = opacity;",
            // "if(dis>size){//外圈",
            // "mOpacity *= (dis-size)>size?0.0:1.0 - (dis-size)/size;",
            // "mOpacity = pow(mOpacity,oPower);",
            // "}",
            // "else if(dis<size){//内圈" ,
            // "mOpacity *= dis/size;" ,
            // "mOpacity = pow(mOpacity,iPower);",
            // "}" ,

            "float mOpacity = dis>size?pow(1.0*(dis-size)>size?0.0:(1.0 - (dis-size)/size),oPower):",
            "dis<size?pow(1.0*(dis/size),iPower):1.0;",
            "vec3 c;",
            "float cFlag = 4.0*pow(mOpacity,2.0);",
            "c = vec3(color[0]*cFlag,color[1]*cFlag,color[2]*cFlag);",


            // "if((mOpacity*opacity)<=0.0){",
            // "discard;",
            // // "gl_FragColor = vec4(1.0,0.0,0.0,1.0);",
            // "}else{",
            // "gl_FragColor = vec4(color,mOpacity*opacity);" ,
            // "}",

            "gl_FragColor = vec4(c,pow(mOpacity,2.0)*opacity);" ,
            "}"
        ].join("\n"),
        //渐变--平面--平面
        GradualChPPFShader: [
            "uniform vec3 color;",
            "uniform vec3 center;//中心位置",
            "uniform float size;//渐变长度",
            "uniform float dividing;//分割长度",
            "uniform float sizeY;//渐变长度",
            "uniform float power;",
            "uniform float opacity;",
            "varying float vOpacity;",
            "varying vec3 mPosition;",
            "void main(){",
            "float disX = mPosition.x - center.x;",
            "float mOpacity = disX>dividing?pow((1.0 - (disX-dividing)/size),power):",
            "disX<dividing?pow(1.0*(disX/dividing),power):1.0;",

            "float disY = abs(mPosition.y - center.y);",
            "float dis = distance(mPosition,center);",
            "float ins = dis>=sizeY?0.0:1.0-dis/sizeY;",

            "gl_FragColor = vec4(color,mOpacity*opacity*ins*vOpacity);" ,
            "}"
        ].join("\n"),
        pointFShader:[
            "uniform sampler2D map;",
            "uniform vec3 color;",
            "varying float topacity;",
            "void main(){",
            "vec4 tColor = texture2D( map, gl_PointCoord );",
            "gl_FragColor = vec4( color * tColor.rgb, tColor.a*topacity )*1.5;",
            "}"
        ].join("\n"),

    };

    //-init
    function initiate(){
        // scene
        thm.scene = _Collects.createScene();
        thm.bloomScene = _Collects.createScene();
        thm.bloomScene.background = null;
        // camera
        var wh = { w: thm.container.width(), h: thm.container.height() };
        thm.camera = _Collects.createCamera( wh );
        // renderer
        thm.renderer = _Collects.createRenderer(wh.w, wh.h);
        thm.renderer.domElement.style.position = 'absolute';
        thm.renderer.domElement.style.top = thm.renderer.domElement.style.left = '0';
        thm.container.append( $(thm.renderer.domElement) );

        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        var renderScene = new THREE_98.RenderPass( thm.bloomScene, thm.camera );

        // resolution, strength, radius, threshold
        var bloomPass = new THREE_98.UnrealBloomPass( new THREE_98.Vector2( wh.w, wh.h ), df_Config.bloomPass.strength, df_Config.bloomPass.radius, df_Config.bloomPass.threshold );
        bloomPass.renderToScreen = true;
        //composer
        thm.composer = new THREE_98.EffectComposer(thm.renderer);
        thm.composer.setSize( wh.w, wh.h );
        thm.composer.addPass( renderScene );
        thm.composer.addPass( bloomPass );
        /////////////////////////////////////////////////////////////////////////////////////////////////////

        // controls
        thm.controls = _Collects.createControls( thm.camera, thm.container[0] );

        thm.raycaster = new THREE_98.Raycaster();

        window.addEventListener('resize', onContResize, false);

        //light
        initLight();
    }

    this.loadFBX = function(url,points,pipData){

        var loader = new THREE_98.FBXLoader();
        loader.load( url, function ( object ) {

            thm.object = [];

            //隐藏物体
            thm.buildings = _Collects.obj();
            thm.scene.add( thm.buildings );
            //独立地图块
            thm.oneMap = _Collects.obj();
            thm.scene.add( thm.oneMap );

            while(object.children.length){

                var child = object.children.pop();
                switch(child.name){
                    case 'map1'://map1--地图块，重置颜色

                        child.material[0].color = new THREE_98.Color(0x050D25);
                        // child.material[2].color = new THREE_98.Color(0x052468);

                        //拾取操作
                        if(isClick){
                            thm.dimian = [child];
                            thm.container[0].addEventListener( 'click', pickClick, false );
                        }

                        thm.buildings.add(child);
                    break;
                    case 'Object003'://Object003--独立地图块：太平镇

                        // //拾取操作
                        // if(isClick){
                        //     thm.dimian = [child];
                        //     thm.container[0].addEventListener( 'click', pickClick, false );
                        // }

                        thm.object.push(child);//拾取对象
                        thm.oneMap.add(child);
                    break;
                    case 'Object004'://Object004--特效模型：储能/用户/水电/变压器
                        child.visible = false;
                        thm.oneMap.add(child);
                    break;
                    case 'floor':
                    case 'border1':
                        thm.oneMap.add(child);
                    break;
                    default:
                        thm.buildings.add(child);
                }
            }

            //点击事件
            thm.container[0].addEventListener( 'mousedown', before_onClick, false );
            thm.container[0].addEventListener( 'mouseup', onClick, false );
            thm.container[0].addEventListener( 'touchstart', before_onClick, false );
            thm.container[0].addEventListener( 'touchend', onClick, false );

            clin_count = df_Config.clin_count;
            //管网效果
            while(pipData.length){

                var tpip = pipData.pop();
                pip(tpip);
            }

            //圆柱特效
            while(points.length){

                var point = points.pop();
                createCylin(point);
            }

            //创建发散点
            var sPoints ={data:[],colors:[],heights:[],type:[],noise:[]};
            var minX = df_Config.point.X[0],maxX = df_Config.point.X[1];
            var minZ = df_Config.point.Z[0],maxZ = df_Config.point.Z[1];
            for(var j=0;j<df_Config.point.count;j++){

                var tx = Math.random()*(maxX-minX+1)+minX;
                var ty = df_Config.point.Y;
                var tz = Math.random()*(maxZ-minZ+1)+minZ;
                // point.point//radius
                sPoints.data.push(tx,ty,tz);
                var one = Math.random();
                sPoints.colors.push(one>0.5?df_Config.point.colors[0]:df_Config.point.colors[1]);
                sPoints.type.push(one);
                sPoints.noise.push(Math.random());
                sPoints.heights.push((Math.random()*(50-40)+40));
            }

            thm.diverPoint = _Collects.obj();
            thm.diverPoint.name = 'diverPoint';
            createPoint(sPoints,df_Config.point.moveDis/*移动距离*/);
            thm.scene.add( thm.diverPoint );

        } );
    };

    //返回
    this.backHome = function(){

        if( intersectObject !== undefined){

            enabledAnim();
            intersectObject = undefined;
        }
    };

    function initLight(){

        var light = new THREE_98.DirectionalLight( 0xffffff, 0.4);//0.4
        light.position.set(5,10,7.5);
        thm.scene.add( light );
        light = new THREE_98.DirectionalLight( 0xffffff, 0.8 );//0.8
        light.position.set(-5,10,-7.5);
        thm.scene.add( light );
        light = new THREE_98.DirectionalLight( 0xffffff, 0.7 );//0.7
        light.position.set(5,10,-7.5);
        thm.scene.add( light );
        light = new THREE_98.DirectionalLight( 0xffffff, 0.4 );//0.4
        light.position.set(-5,10,7.5);
        thm.scene.add( light );
    }

    //发光圆柱
    function createCylin(parm){

        var pos = parm.point;var hight = parm.hight;var r = parm.radius;var color = parm.color;

        var group = _Collects.obj();
        group.visible = parm.visible;
        group.position.copy(pos);

        // 新增 thm.buildings
        if(parm.visible === false || parm.name === '蕉山站'){
            group.name = parm.name;
            thm.oneMap.add( group );
        }else{

            thm.buildings.add(group);
        }

        //圆柱
        var tcolor = new THREE_98.Color(color);
        var cylin = createBaseCy(r+0.2,hight+2, tcolor, group,parm.url);
        cylin.name = parm.name;
        //名称
        (parm.name)&&(cylin.add(createTipName(parm.name,hight/2.0)));
        //2d圆环
        var tparm = {h:hight-10, r:r+0.8, color:tcolor, speed:parm.speed, scale:parm.scale};
        create2DRing( tparm,group,cylin);

    }
    function createBaseCy(r,h,color,group,url){

        //圆柱
        var cylin = new THREE_98.Mesh( _Geometries.cylinBuf(r, r, h, 40, 1, true),_Materials.shader({
            uniforms: {
                color: { value: color },
                startPos: { value: new THREE_98.Vector3(0, (-h/2.0), 0) },
                opacity:{ value: df_Config.cylin.opa_c },
                size: { value: 0.0 }
            },
            transparent: true,
            blending: THREE_98.AdditiveBlending,//NormalBlending/AdditiveBlending/CustomBlending
            depthWrite: false,
            side:THREE_98.DoubleSide,
            vertexShader: _Shaders.GradualChRVShader,
            fragmentShader: _Shaders.GradualChRFShader
        }) );
        cylin.position.y = h/2.0;
        cylin.isCylin = true;cylin.h = (h-0.2)/clin_count;cylin.height = clin_count*cylin.h;
        cylin.pos = group.position;
        group.add( cylin );

        //平面
        var tr = r*4;
        var geo = _Geometries.planeBuf( tr, tr );
        geo.rotateX(-Math.PI/2.0);
        var plane = new THREE_98.Mesh( geo, _Materials.shader({
            uniforms: {
                color: { value: color },
                center: { value: new THREE_98.Vector3(0,0,0) },
                opacity:{ value: df_Config.cylin.opa_p },
                size: { value: tr/2.0 }
            },
            transparent: true,
            depthWrite: false,
            vertexShader: _Shaders.GradualChPVShader,
            fragmentShader: _Shaders.GradualChPFShader
        }) );
        plane.position.y = -0.05;
        group.add( plane );

        return cylin;
    }
    function create2DRing(parm,group,cylin){

        var h = parm.h,r = parm.r,color = parm.color,speed = parm.speed,scale = parm.scale;
        var tr = r*6;
        var geo = _Geometries.planeBuf( tr, tr );
        geo.rotateX(-Math.PI/2.0);
        var plane = new THREE_98.Mesh( geo, _Materials.shader({
            uniforms: {
                color: { value: color },
                center: { value: new THREE_98.Vector3(0,0,0) },
                opacity:{ value: df_Config.cylin.opa_r },
                iPower: { value: 4.0 },//内圈
                oPower: { value: 12.0 },//外圈
                size: { value: r }//分割距离
            },
            transparent: true,
            // blending: THREE_98.AdditiveBlending,//NormalBlending/AdditiveBlending/CustomBlending
            depthWrite: false,
            side:THREE_98.DoubleSide,
            vertexShader: _Shaders.GradualChPVShader,
            fragmentShader: _Shaders.GradualChFPFShader
        }) );
        plane.isTOTop = true;plane.h = h;plane.r = r;plane.tr = scale;plane.speed = speed;plane.isEnd = true;
        plane.visible = false;plane._parent = cylin.uuid;
        group.add( plane );

        var plane1 = new THREE_98.Mesh( geo, plane.material.clone());
        plane1.isTOTop = true;plane1.h = h;plane1.r = r;plane1.tr = scale;plane1.speed = speed;
        plane1.visible = false;
        group.add( plane1 );

        plane1 = new THREE_98.Mesh( geo, plane.material.clone());
        plane1.isTOTop = true;plane1.h = h;plane1.r = r;plane1.tr = scale;plane1.isFirst = true;plane1.speed = speed;
        group.add( plane1 );
        cylin._child = plane1.uuid;

    }
    function createTipName(text,h){

        var txue = _Collects.creatTagsArrTxue( text);
        var _tag = new THREE_98.Sprite( _Materials.sprite({
            color: df_Config.title.color,
            map:txue,
            depthTest: false,
            depthWrite: false,
        }));
        var scale = text.length*df_Config.title.size;
        _tag.scale.set(scale,scale,1);_tag.position.y = h;

        return _tag;
    }

    //发散点线
    function createPoint(parm,len){
        //添加点的粒子
        var geo = new THREE_98.BufferGeometry();
        geo.addAttribute('position', new THREE_98.Float32BufferAttribute(parm.data, 3));
        geo.addAttribute('type',new THREE_98.Float32BufferAttribute(parm.type, 1));
        geo.addAttribute('noise',new THREE_98.Float32BufferAttribute(parm.noise, 1));

        var	point = new THREE_98.Points( geo, _Materials.shader({
            uniforms: {
                size: { value: 12 },//发散长度x
                u_time: { value: 0 },
                u_move: { value: len },
                map1: { value: df_Config.txues._circle_0x0000FF },
                map2: { value: df_Config.txues._circle1_0xFFAB21 }
            },
            transparent: true,
            side:THREE_98.DoubleSide,
            blending: THREE_98.AdditiveBlending,
            depthWrite:false,
            vertexShader: _Shaders.pointVShader_move,
            fragmentShader: _Shaders.pointFShader_move
        }) );
        thm.diverPoint.add( point );
        point._moveLine = true;

        for(var i=0;i<parm.data.length;i+=3){

            var color = new THREE_98.Color(parm.colors[i/3]);

            var h = parm.heights[i/3];
            var w = 12,tw = w/4;
            var tgeo = _Geometries.planeBuf( w, h );
            var linePlane = new THREE_98.Mesh( tgeo, _Materials.shader({
                uniforms: {
                    color: { value:  color },
                    center: { value: new THREE_98.Vector3(0,h/2,0) },
                    opacity:{ value: 1.0 },
                    power: { value: 4.0 },//内圈
                    dividing: { value: tw },//分割距离
                    size: { value: tw },//发散长度x
                    u_time: { value: 0 },
                    u_move: { value: len },
                    u_noise:{value: parm.noise[i/3]},
                    sizeY: { value: h }//发散长度y
                },
                transparent: true,
                side:THREE_98.DoubleSide,
                depthWrite:false,
                blending: THREE_98.AdditiveBlending,
                vertexShader: _Shaders.GradualChPVShader_move,
                fragmentShader: _Shaders.GradualChPPFShader
            }) );
            linePlane.position.set(parm.data[i]-tw,parm.data[i+1]-h/2,parm.data[i+2]);
            linePlane._moveLine = true;
            thm.diverPoint.add(linePlane);
            //白色
            var rlinePlane = linePlane.clone();
            rlinePlane.material = linePlane.material.clone();
            rlinePlane.material.uniforms.color.value = new THREE_98.Color(0xffffff);
            rlinePlane.material.uniforms.power.value = 16.0;
            rlinePlane.material.uniforms.sizeY.value = h*0.5;
            rlinePlane._moveLine = true;
            thm.diverPoint.add(rlinePlane);
        }
    }

    //管网
    function pip(parm,isNext){

        var pipeSpline = new THREE_98.CatmullRomCurve3(parm.data);
        //path, tubularSegments, radius, radialSegments, closed
        var tubeGeometry = new THREE_98.TubeBufferGeometry( pipeSpline, parm.seg, df_Config.pip.r0, 40, false );
        var mesh = new THREE_98.Mesh( tubeGeometry, _Materials.basic({
            color:parm.color,
            opacity:0.0,
            transparent: true,
        }) );
        mesh.op = df_Config.pip.opa0/clin_count;

        tubeGeometry = new THREE_98.TubeBufferGeometry( pipeSpline, parm.seg, df_Config.pip.r1, 3, false );
        var tmesh = new THREE_98.Mesh( tubeGeometry, _Materials.basic({
            color: parm.color,
            opacity:df_Config.pip.opa1,
            transparent: true
        }) );
        tmesh.name = mesh.uuid;
        (!parm.other)&&thm.bloomScene.add( tmesh );

        tmesh.visible = false;
        tmesh.isPIP = mesh.isPIP = true;

        var space = parm.space? parm.space: df_Config.pip.space;
        var count = Math.ceil((tubeGeometry.parameters.path.getLength())/space);
        var point = createMovePoint(tubeGeometry.parameters.path.getSpacedPoints(count),parm.color);
        mesh.moveP = point;
        // thm.scene.add( point );

        // 新增
        // 特殊模型线条
        if(parm.other){

            mesh._index = parm.index;
            thm.oneMap.add( mesh );
            mesh.visible = point.visible = false;
            thm.oneMap.add( point );
        }else if(parm.isSave){

            mesh.name = '蕉山站_线';
            point.name = '_蕉山站_线';
            thm.oneMap.add( mesh );
            thm.oneMap.add( point );
            // thm.buildings.add( point );
        }else{

            thm.buildings.add(mesh);
            thm.buildings.add(point);
        }

        if(parm.isDouble&&!isNext){
            arguments.callee({
                data:parm.data.reverse(),
                seg:parm.seg,
                color:parm.color,
                isDouble:true
            },true);
        }
    }
    //移动粒子
    function createMovePoint(path,color){
        var geo = _Geometries.geoBuf();
        var vertices = [];
        var sizes = [];
        var opacitys = [];
        for(var i =0;i<df_Config.particle.count;i++){
            vertices.push(0,0,0);
            sizes.push(df_Config.particle.size-i*df_Config.particle.space);
            opacitys.push((1.0-0.8*i/(df_Config.particle.count-1)));
        }
        geo.addAttribute( 'position', new THREE_98.Float32BufferAttribute( vertices, 3 ) );
        geo.addAttribute( 'size', new THREE_98.Float32BufferAttribute( sizes, 1 ) );
        geo.addAttribute( 'opacity', new THREE_98.Float32BufferAttribute( opacitys, 1 ) );
        var	point = new THREE_98.Points( geo, _Materials.shader({
            uniforms: {
                color:{value: new THREE_98.Color(color)},
                map: { value: df_Config.txues._spot }
            },
            transparent: true,
            depthTest: false,
            depthWrite: false,
            blending: THREE_98.AdditiveBlending,
            vertexShader: _Shaders.pointVShader,
            fragmentShader: _Shaders.pointFShader
        }) );
        point.visible = false;
        point.path = path;
        point.index = 0;
        point.renderOrder = 2;
        return point;
    }

    var clickTime = 0,clickMove = {},intersectObject = undefined;
    function before_onClick(ev){
        var e = ev||event||arguments[0];
        if(!e) return;

        var point = e.changedTouches?e.changedTouches[0]:e;

        e.preventDefault();
        clickTime = new Date()-0;
        clickMove.x = point.clientX,clickMove.y = point.clientY;
    }
    function onClick( ev ) {
        var e = ev||event||arguments[0];
        if(!e) return;

        var point = e.changedTouches?e.changedTouches[0]:e;

        var now = new Date()-0,nowMove = {
            x:point.clientX,
            y:point.clientY
        };
        if(now-clickTime>500||Math.sqrt(Math.pow(nowMove.x-clickMove.x,2)+Math.pow(nowMove.y-clickMove.y,2))>10){
            return;
        }
        e.preventDefault();

        var mouse = new THREE_98.Vector2();
        mouse.x = ( point.clientX / thm.container.width() ) * 2 - 1;
        mouse.y = - ( point.clientY / thm.container.height() ) * 2 + 1;

        thm.raycaster.setFromCamera( mouse, thm.camera );
        var intersects = thm.raycaster.intersectObjects( thm.object, true );

        if ( intersectObject == undefined && intersects.length > 0 ) {

            //intersects[ 0 ].object
            intersectObject = intersects[ 0 ].object;
            resetCylinAnim();
        }
        // else if( intersects.length <= 0 && intersectObject !== undefined){
        //
        //     enabledAnim();
        //     intersectObject = undefined;
        // }

    }

    function pickClick( e ) {

        e.preventDefault();

        var mouse = new THREE_98.Vector2();
        mouse.x = ( e.layerX / thm.container.width() ) * 2 - 1;
        mouse.y = - ( e.layerY / thm.container.height() ) * 2 + 1;

        console.log("position: ["+thm.camera.position.x+","+thm.camera.position.y+","+thm.camera.position.z+"]");
        console.log("target: ["+thm.controls.target.x+","+thm.controls.target.y+","+thm.controls.target.z+"]");
        thm.raycaster.setFromCamera( mouse, thm.camera );
        var intersects = thm.raycaster.intersectObjects( thm.dimian,true );
        if ( intersects.length > 0 ) {
            // console.log('new THREE_98.Vector3( '+intersects[0].point.x+','+intersects[0].point.y+","+intersects[0].point.z+'),');
            //15.4
            console.log('new THREE_98.Vector3( '+intersects[0].point.x+',15.4,'+intersects[0].point.z+'),');
        }
    }

    function onContResize () {

        var wh = { w: thm.container.width(), h: thm.container.height() };
        thm.camera.aspect = wh.w/wh.h;
        thm.camera.updateProjectionMatrix();
        thm.renderer.setSize(wh.w, wh.h);

        thm.composer.setSize( wh.w, wh.h );
    }

    //
    var clin_count = 0,anim_start = true;
    function animToStart(){

        clin_count--;
        thm.scene.traverse(function(child){

            if(child.isCylin){
                child.material.uniforms.size.value +=child.h;
            }else if(child.isPIP){
                child.material.opacity +=child.op;
            }
        });
        if(clin_count<=0){
            thm.bloomScene.traverse(function(child) {
                if(child.isPIP){
                    var mesh = thm.scene.getObjectByProperty('uuid',child.name);
                    (mesh)&&(mesh.moveP.visible = child.visible = true);
                }
            });
            anim_start = false;
        }
    }

    function animPipMove(){

        thm.scene.traverseVisible(function(child){
            if(child.isPIP){
                var point = child.moveP;
                point.index++;
                if(point.index >= point.path.length){
                    point.index = 0;
                }
                var position = point.geometry.attributes.position;
                var index = point.index;
                for(var i=0;i<40;i++){
                    position.setXYZ(i,point.path[index].x,point.path[index].y,point.path[index].z);
                    index--;
                    (index<0)&&(index=0);
                }
                point.geometry.attributes.position.needsUpdate = true;
            }
        });
    }

    //圆柱特效还原
    function resetCylinAnim(){

        //bloomScene
        thm.bloomScene.visible = false;

        //thm.buildings--隐藏
        thm.buildings.visible = false;

        //thm.oneMap--独立地图块中的特殊模型--水电/用户、储能--显示
        thm.oneMap.children[1].visible = true;

        //
        var lookAt = new THREE_98.Vector3(df_Config.anim.target[0],df_Config.anim.target[1],df_Config.anim.target[2]);
        updateView(lookAt,df_Config.anim.position,df_Config.anim.duration,function(){

            thm.controls.target.copy(lookAt);thm.controls.update();

            //圆柱、线条流动特效处理
            for(var i=4;i<thm.oneMap.children.length;i++){

                if(thm.oneMap.children[i].name === '主要用户'){

                    thm.oneMap.children[i].visible = true;
                    break;
                }
            }

            //计时开始
            clock.start();
        });

    }
    //开启特效
    function enabledAnim(){

        //thm.buildings--显示
        thm.buildings.visible = true;

        //thm.oneMap--独立地图块中的特殊模型--水电/用户、储能--隐藏
        thm.oneMap.children[1].visible = false;
        //圆柱特效处理
        restAnim(false);

        //暂停
        clock.stop();

        //还原视角
        var lookAt = new THREE_98.Vector3(df_Config.controls.target[0], df_Config.controls.target[1], df_Config.controls.target[2]);
        updateView(lookAt,df_Config.camera.position,df_Config.anim.duration,function(){

            thm.controls.target.copy(lookAt);thm.controls.update();

            //bloomScene
            thm.bloomScene.visible = true;
        });

    }
    //还原动画
    function restAnim(value){

        for(var i=4;i<thm.oneMap.children.length;i++) {

            var child = thm.oneMap.children[i];

            //蕉山站发光
            if(child.name === '蕉山站'){

                child.visible = true;
            }
            //主要用户value:true-发光;false-不发光
            else if(child.name === '主要用户'){

                child.visible = value;
            }
            //连接“蕉山站”那条红色的线是黄色的
            else if(child.name === '蕉山站_线' || child.name === '_蕉山站_线'){

                child.visible = true;
                // child.moveP.index = 0;
                // child.material.color.setHex(0xFFFF00);
            }else{

                child.visible = false;
                if(child.moveP){

                    child.moveP.visible = false;
                    child.moveP.index = 0;
                }
            }
        }

        //步骤
        step = 1;
    }
    //视角切换
    function updateView(lookAt,position,speed,onComplete){

        var tween  = new TWEEN.Tween( thm.camera.position )
            .to( { x: position[0], y: position[1], z: position[2] }, speed )
            .easing( TWEEN.Easing.Sinusoidal.InOut )
            .start()
            .onUpdate(tweenHandler2)
            .onComplete(function(){
                onComplete();
        });

        function tweenHandler2() {

            thm.camera.lookAt(lookAt);
        }
    }

    /**
     * 动画步骤
     * 1：连接“蕉山站”那条红色的线是黄色的，流体运动全程线，焦山站发光，用户发光
     * 2：3秒后连接蕉山站的线变成黄色 + 红色，流体运动半截黄线，蕉山站不发光了，储能发光，储能连接至用户
     * 3：5秒后水电发光，水电连接至变压器,变压器发光,变压器连接至用户
     * 4：5秒后变压器连接至储能
     * 5：5秒后重新开始
     */
    var clock = new THREE_98.Clock();
    var step = 1;//步骤
    function playAnim(){

        TWEEN.update();

        if(!clock.running)return;

        var elapsedTime = clock.getElapsedTime();

        //步骤二
        if(step===1 && elapsedTime >= 3.0){

            var tindex =0;//6
            for(var i=4;i<thm.oneMap.children.length;i++){

                var child = thm.oneMap.children[i];

                //蕉山站不发光
                if(child.name === '蕉山站'){

                    child.visible = false;
                    tindex++;
                }
                //线变成黄色 + 红色
                else if(child._index === 5){

                    child.visible = child.moveP.visible  = true;
                    tindex++;
                }
                //线变成黄色 + 红色
                else if(child._index === 6){

                    child.visible = true;
                    tindex++;
                }
                //储能发光
                else if(child.name === '储能'){

                    child.visible = true;
                    tindex++;
                }
                //线变成红色
                else if(child.name === '蕉山站_线'){

                    child.visible = child.moveP.visible = false;
                    child.moveP.index = 0;
                    // child.material.color.setHex(0xFF0000);
                    tindex++;
                }
                //储能连接至用户
                else if(child._index === 1){

                    child.visible = child.moveP.visible = true;
                    tindex++;
                }

                if(tindex == 6)break;
            }

            step = 2;
        }
        //步骤三
        else if(step===2 && elapsedTime >= 8.0){

            var tindex =0;//4
            for(var i=4;i<thm.oneMap.children.length;i++){

                var child = thm.oneMap.children[i];

                //水电发光/变压器发光
                if(child.name === '水电' || child.name === '变压器'){

                    child.visible = true;
                    tindex++;
                }
                //水电连接至变压器/变压器连接至用户
                else if(child._index === 2 || child._index === 3){

                    child.visible = child.moveP.visible = true;
                    tindex++;
                }

                if(tindex == 4)break;
            }

            step = 3;
        }
        //步骤四
        else if(step===3 && elapsedTime >= 13.0){

            for(var i=4;i<thm.oneMap.children.length;i++){

                var child = thm.oneMap.children[i];
                //变压器连接至储能
                if(child._index === 4){

                    child.visible = child.moveP.visible = true;
                    break;
                }
            }

            step = 4;
        }
        //步骤五
        else if(step===4 && elapsedTime >= 18.0){

            restAnim(true);
            //计时重置
            clock.start();
        }
    }

    function animToRun(){


        !thm.bloomScene.visible && playAnim();

        animToTopCylin();
        animToTop2D();
    }
    function animToTopCylin(){

        thm.scene.traverseVisible(function(child){

            if(child.isCylin && child.cyRun){
                var meter = child.material;
                meter.uniforms.size.value +=child.h;

                if(meter.uniforms.size.value < Math.abs(child.h)){
                    child.h *=-1;
                }
                if(meter.uniforms.size.value >=child.height){
                    meter.uniforms.size.value = child.height;
                    var mesh = thm.scene.getObjectByProperty('uuid',child._child);
                    (mesh)&&(mesh.visible = true);
                    delete child.cyRun;
                }
            }
        });
    }
    function animToTop2D(){

        var tChild = undefined;
        thm.scene.traverse(function(child){

            if(child.isTOTop){

                if(child.visible){

                    child.position.y +=child.speed;
                    var tv = child.position.y/child.h;
                    child.material.uniforms.opacity.value = 1.0-tv;
                    child.material.uniforms.size.value = child.r*(1.0+ child.tr*tv);

                    (tChild && !tChild.visible && child.position.y >= (child.h/3.0))&&(tChild.visible = true);

                    if(child.position.y>= child.h){
                        child.position.y = 0;
                        child.material.uniforms.opacity.value = 1.0;
                        child.material.uniforms.size.value = child.r;
                        child.visible = false;

                        if(child.isEnd){
                            var mesh = thm.scene.getObjectByProperty('uuid',child._parent);
                            if(mesh){
                                mesh.cyRun = true;mesh.h *=-1;
                            }
                        }
                    }
                }
                tChild = child;
            }else{
                tChild = undefined;
            }
        });
    }

    var oldTime_diverPoint = new Date();
    function animDiverPoint(){
        var t= new Date(),dt = t - oldTime_diverPoint;
        oldTime_diverPoint = t;
        dt/=1000;
        if(dt>1) return;
        thm.diverPoint&&thm.diverPoint.traverse(function(obj){
            if(obj._moveLine){
                var t = obj.material.uniforms.u_time.value,k = 0.25;
                t+=dt*k;
                if(t>1.0) t-=1.0;
                obj.material.uniforms.u_time.value = t;
            }
        });
    }
    function renderers () {
        (function Animations() {

            if(isInit){
                df_anima = requestAnimationFrame(Animations);

                (clin_count>0 && anim_start)&&(animToStart());
                ( !anim_start )&&(animToRun());
                (thm.bloomScene.children.length && !anim_start)&&(animPipMove());//粒子移动

                //添加动画
                animDiverPoint();

                thm.renderer.render( thm.scene, thm.camera );
                thm.bloomScene.children.length && thm.composer.render();
            }else{
                df_anima && cancelAnimationFrame(df_anima);

                thm.renderer.dispose();
                thm.renderer.forceContextLoss();
                thm.controls.dispose();
                disposeScene();
            }
        })();
    }

    function detector () {
        try {
            return !! window.WebGLRenderingContext && !! document.createElement('canvas').getContext('experimental-webgl');
        } catch( e ) { return false; }
    }
    function parseCts ( cts ) {
        var $dom = ( typeof cts == 'object' )? $(cts): $('#'+cts);
        if ( $dom.length <= 0 ) return null;
        return $dom;
    }
    function creatContainer ( id ) {
        var containers = $('<div></div>');
        containers.css("cssText", "height:100%;width:100%;overflow:hidden;position:relative !important");
        containers.attr('id', id);
        return containers;
    }
    function creatError ( conts, errorText ) {
        var error = $('<div class="data-error"></div>'),
            error_text = errorText || '数据错误。。。';
        if( undefined != conts ) {
            var ctxt = "color:#fff;position:absolute;top:49%;width:100%;text-align:center;";
            error.css("cssText", ctxt);
            conts.html( error.html(error_text) );
        }
    }

    function destroy(){
        objectTraverse(thm.scene,function(obj){
            if (obj.geometry) {
                if (obj.geometry._bufferGeometry) {
                    obj.geometry._bufferGeometry.dispose();
                }
                obj.geometry.dispose();
                obj.geometry = null;

                //material
                if(Array.isArray(obj.material)){

                    // for(var material of obj.material){
                    //     disposeMaterial(material);
                    // }
                    for(var i=0;i<obj.material.length;i++){
                        var material = obj.material[i];
                        disposeMaterial(material);
                    }
                }else{

                    disposeMaterial(obj.material);
                }
            }

            if (obj.parent) obj.parent.remove(obj);
            obj = null;
        });

        function objectTraverse(obj, callback) {
            if (!callback) return;
            var children = obj.children;
            for (var i = children.length - 1; i >= 0; i--) {
                objectTraverse(children[i], callback);
            }
            callback(obj);
        }

        thm.container.remove();

        var i;
        for(i in thm){
            delete thm[i];
        }
    }
    function disposeMaterial( mtl ){

        if ( mtl.uniforms && mtl.uniforms.u_txue && mtl.uniforms.u_txue.value ) {
            if (mtl.__webglShader) {
                mtl.__webglShader.uniforms.u_txue.value.dispose();
                mtl.__webglShader.uniforms.u_txue.value = null;
            } else {
                mtl.uniforms.u_txue.value.dispose();
                mtl.uniforms.u_txue.value = null;
            }
        }
        if ( mtl.map ) {
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

    function disposeScene(){

        df_anima = undefined;
        oldTime_diverPoint = null;
        clickTime = 0;clickMove = undefined;intersectObject = undefined;

        _Collects = null;
        _Materials = null;
        _Geometries = null;
        _Shaders = null;

        delete df_Config.txues;df_Config = null;

        thm.object && thm.object.splice(0);thm.object = null;
        if(thm.dimian){
            thm.container[0].removeEventListener( 'click', pickClick, false );
            thm.dimian.splice(0);
        }
        thm.diverPoint = thm.buildings = thm.oneMap = null;

        thm.container[0].removeEventListener( 'mousedown', before_onClick, false );
        thm.container[0].removeEventListener( 'mouseup', onClick, false );
        thm.container[0].removeEventListener( 'touchstart', before_onClick, false );
        thm.container[0].removeEventListener( 'touchend', onClick, false );

        destroy();

        thm.scene = null;thm.bloomScene = null;
        thm.camera = null;thm.raycaster = null;
        thm.renderer = null;thm.composer = null;
        thm.controls = null;
        thm.container = null;

        thm = null;
        renderers = null;
    }

};

function __setControls(){
    THREE_98.OrbitControls=function(object,domElement){this.object=object;this.domElement=(domElement!==undefined)?domElement:document;this.enabled=true;this.target=new THREE_98.Vector3();this.minDistance=0;this.maxDistance=Infinity;this.minZoom=0;this.maxZoom=Infinity;this.minPolarAngle=0;this.maxPolarAngle=Math.PI;this.minAzimuthAngle=-Infinity;this.maxAzimuthAngle=Infinity;this.enableDamping=false;this.dampingFactor=0.25;this.enableZoom=true;this.zoomSpeed=1;this.enableRotate=true;this.rotateSpeed=1;this.enablePan=true;this.panSpeed=1;this.screenSpacePanning=false;this.keyPanSpeed=7;this.autoRotate=false;this.autoRotateSpeed=2;this.enableKeys=true;this.keys={LEFT:37,UP:38,RIGHT:39,BOTTOM:40};this.mouseButtons={LEFT:THREE_98.MOUSE.LEFT,MIDDLE:THREE_98.MOUSE.MIDDLE,RIGHT:THREE_98.MOUSE.RIGHT};this.target0=this.target.clone();this.position0=this.object.position.clone();this.zoom0=this.object.zoom;this.enablePan_UP=false;this.getPolarAngle=function(){return spherical.phi};this.getAzimuthalAngle=function(){return spherical.theta};this.saveState=function(){scope.target0.copy(scope.target);scope.position0.copy(scope.object.position);scope.zoom0=scope.object.zoom};this.reset=function(){scope.target.copy(scope.target0);scope.object.position.copy(scope.position0);scope.object.zoom=scope.zoom0;scope.object.updateProjectionMatrix();scope.dispatchEvent(changeEvent);scope.update();state=STATE.NONE};this.update=function(){var offset=new THREE_98.Vector3();var quat=new THREE_98.Quaternion().setFromUnitVectors(object.up,new THREE_98.Vector3(0,1,0));var quatInverse=quat.clone().inverse();var lastPosition=new THREE_98.Vector3();var lastQuaternion=new THREE_98.Quaternion();return function update(){var position=scope.object.position;offset.copy(position).sub(scope.target);offset.applyQuaternion(quat);spherical.setFromVector3(offset);if(scope.autoRotate&&state===STATE.NONE){rotateLeft(getAutoRotationAngle())}spherical.theta+=sphericalDelta.theta;spherical.phi+=sphericalDelta.phi;spherical.theta=Math.max(scope.minAzimuthAngle,Math.min(scope.maxAzimuthAngle,spherical.theta));spherical.phi=Math.max(scope.minPolarAngle,Math.min(scope.maxPolarAngle,spherical.phi));spherical.makeSafe();spherical.radius*=scale;spherical.radius=Math.max(scope.minDistance,Math.min(scope.maxDistance,spherical.radius));scope.target.add(panOffset);offset.setFromSpherical(spherical);offset.applyQuaternion(quatInverse);position.copy(scope.target).add(offset);scope.object.lookAt(scope.target);if(scope.enableDamping===true){sphericalDelta.theta*=(1-scope.dampingFactor);sphericalDelta.phi*=(1-scope.dampingFactor);panOffset.multiplyScalar(1-scope.dampingFactor)}else{sphericalDelta.set(0,0,0);panOffset.set(0,0,0)}scale=1;if(zoomChanged||lastPosition.distanceToSquared(scope.object.position)>EPS||8*(1-lastQuaternion.dot(scope.object.quaternion))>EPS){scope.dispatchEvent(changeEvent);lastPosition.copy(scope.object.position);lastQuaternion.copy(scope.object.quaternion);zoomChanged=false;return true}return false}}();this.dispose=function(){scope.domElement.removeEventListener("contextmenu",onContextMenu,false);scope.domElement.removeEventListener("mousedown",onMouseDown,false);scope.domElement.removeEventListener("wheel",onMouseWheel,false);scope.domElement.removeEventListener("touchstart",onTouchStart,false);scope.domElement.removeEventListener("touchend",onTouchEnd,false);scope.domElement.removeEventListener("touchmove",onTouchMove,false);document.removeEventListener("mousemove",onMouseMove,false);document.removeEventListener("mouseup",onMouseUp,false);window.removeEventListener("keydown",onKeyDown,false)};var scope=this;var changeEvent={type:"change"};var startEvent={type:"start"};var endEvent={type:"end"};var STATE={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_DOLLY_PAN:4};var state=STATE.NONE;var EPS=0.000001;var spherical=new THREE_98.Spherical();var sphericalDelta=new THREE_98.Spherical();var scale=1;var panOffset=new THREE_98.Vector3();var zoomChanged=false;var rotateStart=new THREE_98.Vector2();var rotateEnd=new THREE_98.Vector2();var rotateDelta=new THREE_98.Vector2();var panStart=new THREE_98.Vector2();var panEnd=new THREE_98.Vector2();var panDelta=new THREE_98.Vector2();var dollyStart=new THREE_98.Vector2();var dollyEnd=new THREE_98.Vector2();var dollyDelta=new THREE_98.Vector2();function getAutoRotationAngle(){return 2*Math.PI/60/60*scope.autoRotateSpeed}function getZoomScale(){return Math.pow(0.95,scope.zoomSpeed)}function rotateLeft(angle){sphericalDelta.theta-=angle}function rotateUp(angle){sphericalDelta.phi-=angle}var panLeft=function(){var v=new THREE_98.Vector3();return function panLeft(distance,objectMatrix){v.setFromMatrixColumn(objectMatrix,0);v.multiplyScalar(-distance);panOffset.add(v)}}();var panUp=function(){var v=new THREE_98.Vector3();return function panUp(distance,objectMatrix){if(scope.screenSpacePanning===true){v.setFromMatrixColumn(objectMatrix,1)}else{v.setFromMatrixColumn(objectMatrix,0);v.crossVectors(scope.object.up,v)}v.multiplyScalar(distance);panOffset.add(v)}}();var pan=function(){var offset=new THREE_98.Vector3();
        return function pan(deltaX,deltaY){var element=scope.domElement===document?scope.domElement.body:scope.domElement;if(scope.object.isPerspectiveCamera){var position=scope.object.position;offset.copy(position).sub(scope.target);var targetDistance=offset.length();targetDistance*=Math.tan((scope.object.fov/2)*Math.PI/180);panLeft(2*deltaX*targetDistance/element.clientHeight,scope.object.matrix);(scope.enablePan_UP)&&(panUp(2*deltaY*targetDistance/element.clientHeight,scope.object.matrix))}else{if(scope.object.isOrthographicCamera){panLeft(deltaX*(scope.object.right-scope.object.left)/scope.object.zoom/element.clientWidth,scope.object.matrix);(scope.enablePan_UP)&&(panUp(deltaY*(scope.object.top-scope.object.bottom)/scope.object.zoom/element.clientHeight,scope.object.matrix))}else{console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.");scope.enablePan=false}}}}();function dollyIn(dollyScale){if(scope.object.isPerspectiveCamera){scale/=dollyScale}else{if(scope.object.isOrthographicCamera){scope.object.zoom=Math.max(scope.minZoom,Math.min(scope.maxZoom,scope.object.zoom*dollyScale));scope.object.updateProjectionMatrix();zoomChanged=true}else{console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.");scope.enableZoom=false}}}function dollyOut(dollyScale){if(scope.object.isPerspectiveCamera){scale*=dollyScale}else{if(scope.object.isOrthographicCamera){scope.object.zoom=Math.max(scope.minZoom,Math.min(scope.maxZoom,scope.object.zoom/dollyScale));scope.object.updateProjectionMatrix();zoomChanged=true}else{console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.");scope.enableZoom=false}}}function handleMouseDownRotate(event){rotateStart.set(event.clientX,event.clientY)}function handleMouseDownDolly(event){dollyStart.set(event.clientX,event.clientY)}function handleMouseDownPan(event){panStart.set(event.clientX,event.clientY)}function handleMouseMoveRotate(event){rotateEnd.set(event.clientX,event.clientY);rotateDelta.subVectors(rotateEnd,rotateStart).multiplyScalar(scope.rotateSpeed);var element=scope.domElement===document?scope.domElement.body:scope.domElement;rotateLeft(2*Math.PI*rotateDelta.x/element.clientHeight);rotateUp(2*Math.PI*rotateDelta.y/element.clientHeight);rotateStart.copy(rotateEnd);scope.update()}function handleMouseMoveDolly(event){dollyEnd.set(event.clientX,event.clientY);dollyDelta.subVectors(dollyEnd,dollyStart);if(dollyDelta.y>0){dollyIn(getZoomScale())}else{if(dollyDelta.y<0){dollyOut(getZoomScale())}}dollyStart.copy(dollyEnd);scope.update()}function handleMouseMovePan(event){panEnd.set(event.clientX,event.clientY);panDelta.subVectors(panEnd,panStart).multiplyScalar(scope.panSpeed);pan(panDelta.x,panDelta.y);panStart.copy(panEnd);scope.update()}function handleMouseUp(event){}function handleMouseWheel(event){if(event.deltaY<0){dollyOut(getZoomScale())}else{if(event.deltaY>0){dollyIn(getZoomScale())}}scope.update()}function handleKeyDown(event){switch(event.keyCode){case scope.keys.UP:pan(0,scope.keyPanSpeed);scope.update();break;case scope.keys.BOTTOM:pan(0,-scope.keyPanSpeed);scope.update();break;case scope.keys.LEFT:pan(scope.keyPanSpeed,0);scope.update();break;case scope.keys.RIGHT:pan(-scope.keyPanSpeed,0);scope.update();break}}function handleTouchStartRotate(event){rotateStart.set(event.touches[0].pageX,event.touches[0].pageY)}function handleTouchStartDollyPan(event){if(scope.enableZoom){var dx=event.touches[0].pageX-event.touches[1].pageX;var dy=event.touches[0].pageY-event.touches[1].pageY;var distance=Math.sqrt(dx*dx+dy*dy);dollyStart.set(0,distance)}if(scope.enablePan){var x=0.5*(event.touches[0].pageX+event.touches[1].pageX);var y=0.5*(event.touches[0].pageY+event.touches[1].pageY);panStart.set(x,y)}}function handleTouchMoveRotate(event){rotateEnd.set(event.touches[0].pageX,event.touches[0].pageY);rotateDelta.subVectors(rotateEnd,rotateStart).multiplyScalar(scope.rotateSpeed);var element=scope.domElement===document?scope.domElement.body:scope.domElement;rotateLeft(2*Math.PI*rotateDelta.x/element.clientHeight);rotateUp(2*Math.PI*rotateDelta.y/element.clientHeight);rotateStart.copy(rotateEnd);scope.update()}function handleTouchMoveDollyPan(event){if(scope.enableZoom){var dx=event.touches[0].pageX-event.touches[1].pageX;var dy=event.touches[0].pageY-event.touches[1].pageY;var distance=Math.sqrt(dx*dx+dy*dy);dollyEnd.set(0,distance);dollyDelta.set(0,Math.pow(dollyEnd.y/dollyStart.y,scope.zoomSpeed));dollyIn(dollyDelta.y);dollyStart.copy(dollyEnd)}if(scope.enablePan){var x=0.5*(event.touches[0].pageX+event.touches[1].pageX);var y=0.5*(event.touches[0].pageY+event.touches[1].pageY);panEnd.set(x,y);panDelta.subVectors(panEnd,panStart).multiplyScalar(scope.panSpeed);pan(panDelta.x,panDelta.y);panStart.copy(panEnd)}scope.update()}function handleTouchEnd(event){}function onMouseDown(event){if(scope.enabled===false){return}event.preventDefault();switch(event.button){case scope.mouseButtons.LEFT:if(event.ctrlKey||event.metaKey){if(scope.enablePan===false){return
    }handleMouseDownPan(event);state=STATE.PAN}else{if(scope.enableRotate===false){return}handleMouseDownRotate(event);state=STATE.ROTATE}break;case scope.mouseButtons.MIDDLE:if(scope.enableZoom===false){return}handleMouseDownDolly(event);state=STATE.DOLLY;break;case scope.mouseButtons.RIGHT:if(scope.enablePan===false){return}handleMouseDownPan(event);state=STATE.PAN;break}if(state!==STATE.NONE){document.addEventListener("mousemove",onMouseMove,false);document.addEventListener("mouseup",onMouseUp,false);scope.dispatchEvent(startEvent)}}function onMouseMove(event){if(scope.enabled===false){return}event.preventDefault();switch(state){case STATE.ROTATE:if(scope.enableRotate===false){return}handleMouseMoveRotate(event);break;case STATE.DOLLY:if(scope.enableZoom===false){return}handleMouseMoveDolly(event);break;case STATE.PAN:if(scope.enablePan===false){return}handleMouseMovePan(event);break}}function onMouseUp(event){if(scope.enabled===false){return}handleMouseUp(event);document.removeEventListener("mousemove",onMouseMove,false);document.removeEventListener("mouseup",onMouseUp,false);scope.dispatchEvent(endEvent);state=STATE.NONE}function onMouseWheel(event){if(scope.enabled===false||scope.enableZoom===false||(state!==STATE.NONE&&state!==STATE.ROTATE)){return}event.preventDefault();event.stopPropagation();scope.dispatchEvent(startEvent);handleMouseWheel(event);scope.dispatchEvent(endEvent)}function onKeyDown(event){if(scope.enabled===false||scope.enableKeys===false||scope.enablePan===false){return}handleKeyDown(event)}function onTouchStart(event){if(scope.enabled===false){return}event.preventDefault();switch(event.touches.length){case 1:if(scope.enableRotate===false){return}handleTouchStartRotate(event);state=STATE.TOUCH_ROTATE;break;case 2:if(scope.enableZoom===false&&scope.enablePan===false){return}handleTouchStartDollyPan(event);state=STATE.TOUCH_DOLLY_PAN;break;default:state=STATE.NONE}if(state!==STATE.NONE){scope.dispatchEvent(startEvent)}}function onTouchMove(event){if(scope.enabled===false){return}event.preventDefault();event.stopPropagation();switch(event.touches.length){case 1:if(scope.enableRotate===false){return}if(state!==STATE.TOUCH_ROTATE){return}handleTouchMoveRotate(event);break;case 2:if(scope.enableZoom===false&&scope.enablePan===false){return}if(state!==STATE.TOUCH_DOLLY_PAN){return}handleTouchMoveDollyPan(event);break;default:state=STATE.NONE}}function onTouchEnd(event){if(scope.enabled===false){return}handleTouchEnd(event);scope.dispatchEvent(endEvent);state=STATE.NONE}function onContextMenu(event){if(scope.enabled===false){return}event.preventDefault()}scope.domElement.addEventListener("contextmenu",onContextMenu,false);scope.domElement.addEventListener("mousedown",onMouseDown,false);scope.domElement.addEventListener("wheel",onMouseWheel,false);scope.domElement.addEventListener("touchstart",onTouchStart,false);scope.domElement.addEventListener("touchend",onTouchEnd,false);scope.domElement.addEventListener("touchmove",onTouchMove,false);window.addEventListener("keydown",onKeyDown,false);this.update()};THREE_98.OrbitControls.prototype=Object.create(THREE_98.EventDispatcher.prototype);THREE_98.OrbitControls.prototype.constructor=THREE_98.OrbitControls;Object.defineProperties(THREE_98.OrbitControls.prototype,{center:{get:function(){console.warn("THREE_98.OrbitControls: .center has been renamed to .target");return this.target}},noZoom:{get:function(){console.warn("THREE_98.OrbitControls: .noZoom has been deprecated. Use .enableZoom instead.");return !this.enableZoom},set:function(value){console.warn("THREE_98.OrbitControls: .noZoom has been deprecated. Use .enableZoom instead.");this.enableZoom=!value}},noRotate:{get:function(){console.warn("THREE_98.OrbitControls: .noRotate has been deprecated. Use .enableRotate instead.");return !this.enableRotate},set:function(value){console.warn("THREE_98.OrbitControls: .noRotate has been deprecated. Use .enableRotate instead.");this.enableRotate=!value}},noPan:{get:function(){console.warn("THREE_98.OrbitControls: .noPan has been deprecated. Use .enablePan instead.");return !this.enablePan},set:function(value){console.warn("THREE_98.OrbitControls: .noPan has been deprecated. Use .enablePan instead.");this.enablePan=!value}},noKeys:{get:function(){console.warn("THREE_98.OrbitControls: .noKeys has been deprecated. Use .enableKeys instead.");return !this.enableKeys},set:function(value){console.warn("THREE_98.OrbitControls: .noKeys has been deprecated. Use .enableKeys instead.");this.enableKeys=!value}},staticMoving:{get:function(){console.warn("THREE_98.OrbitControls: .staticMoving has been deprecated. Use .enableDamping instead.");return !this.enableDamping},set:function(value){console.warn("THREE_98.OrbitControls: .staticMoving has been deprecated. Use .enableDamping instead.");this.enableDamping=!value}},dynamicDampingFactor:{get:function(){console.warn("THREE_98.OrbitControls: .dynamicDampingFactor has been renamed. Use .dampingFactor instead.");return this.dampingFactor},set:function(value){console.warn("THREE_98.OrbitControls: .dynamicDampingFactor has been renamed. Use .dampingFactor instead.");
        this.dampingFactor=value}}});
}