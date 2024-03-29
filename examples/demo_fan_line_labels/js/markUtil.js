
var _Shaders = {
    //-
    PointVShader: [

        "uniform float size;",//点大小

        "attribute vec3 color;",//点颜色
        "varying vec4 vColor;",//传递给片元着色器的颜色变量

        "void main(){",

        "vColor = vec4(color, 1.0); ",//传递给片元着色器的颜色值

        "vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
        "gl_PointSize = size * ( 300.0 / -mvPosition.z );",//计算点大小

        "gl_Position = projectionMatrix * mvPosition;",//根据总变换矩阵计算此次绘制此顶点位置
        "}"
    ].join("\n"),
    PointFShader: [

        "uniform sampler2D map;",//纹理对象

        "varying vec4 vColor;",//接收从顶点着色器过来的颜色参数

        "void main(){",

        "vec2 center = vec2(0.5);",
        "float dis = distance(gl_PointCoord, center);",
        "dis = dis<0.2?dis/0.2:1.0;",
        "vec4 fColor = mix(vec4(1.0), vColor, vec4(dis));",

        "gl_FragColor =  fColor * texture2D( map, gl_PointCoord );",//计算此片元颜色值

        // "vec4 fColor = mix(vec4(1.0), vColor, vec4(gl_PointCoord.x));",
        // "gl_FragColor =  fColor * texture2D( map, gl_PointCoord );",//计算此片元颜色值
        "}"
    ].join("\n"),

    LineVShader:[

        "uniform vec2 instanceScale;",//缩放值

        "attribute vec3 offset;",//位置偏移值
        "attribute vec3 color;",//颜色

        "varying vec3 mPosition;",//传递给片元着色器的位置变量
        "varying vec4 vColor;",//传递给片元着色器的颜色变量
        "varying float isX;",

        "void main(){",

        "mPosition = position;",//传递给片元着色器的颜色值
        "vColor = vec4(color, 1.0); ",//传递给片元着色器的颜色值
        "isX = position.z==0.0?1.0:0.0;",

        //- 计算位置
        "vec3 aPosition = position * vec3(instanceScale, 1.0);",
        "gl_Position = projectionMatrix * modelViewMatrix * vec4(offset+aPosition, 1.0);",

        "}"
    ].join("\n"),
    //渐变--平面--平面
    LineFShader: [

        "uniform vec2 center;",//中心位置
        "uniform float size;",//渐变长度
        "uniform float sizeX;",//分割长度
        "uniform float sizeY;",//渐变长度
        "uniform float power;",

        "varying vec3 mPosition;",//接收从顶点着色器过来的位置参数
        "varying vec4 vColor;",//接收从顶点着色器过来的颜色参数
        "varying float isX;",

        "void main(){",

        //- 计算x/z轴渐变
        "float disX = (isX>0.0?mPosition.x:mPosition.z) - center.x;",
        "float opacityX = disX>sizeX?pow((1.0 - (disX-sizeX)/size), power):",
        "disX<sizeX?pow((disX/sizeX),power):1.0;",

        //- 计算y轴渐变
        "float disY = abs(mPosition.y - center.y);",
        "float opacityY = disY>=sizeY?0.0:1.0-disY/sizeY;",

        // "vec3 eColor = vec3(1.0);",
        // "float tOpacity = pow(opacityX, 2.0);",
        // "vec3 aColor = mix(vColor.rgb, eColor, vec3(tOpacity));",
        //
        // "tOpacity = disY>=(sizeY*0.6)?0.0:1.0-disY/(sizeY*0.6);",
        // "aColor *= mix(vColor.rgb, eColor, vec3(tOpacity));",
        //
        // "gl_FragColor = vec4(aColor, vColor.a*opacityX*opacityY); ",

        "gl_FragColor = vec4(vColor.rgb, vColor.a*opacityX*opacityY); ",//计算此片元颜色值
        "}"
    ].join("\n"),

    CylidVShader: [

        "uniform float elapsedTime;",
        "uniform float height;",
        "uniform float width;",
        "uniform float perimeter;",//- 周长
        "uniform vec2 offset;",

        "attribute vec4 translate;",

        "varying vec2 vUv;",
        "varying float isT;",
        "varying vec3 tPos;",
        "varying float ratio;",

        "void main(){",

        "vec2 scale =vec2(width, height);",

        "isT = uv.x==-1.0?1.0:uv.x==-2.0?-1.0:0.0;",//柱体底部：1.0-底部，进行发散效果处理；-1.0-平面，进行圆环效果处理；0.0-纹理贴图

        "float maxT = scale.y/(scale.x*perimeter);",
        "vUv= vec2(uv.x, maxT*uv.y - fract( (translate.w+elapsedTime * offset.y)*maxT ) );",

        "tPos = position;",
        "ratio = translate.w;",

        "vec3 mPosition = position*vec3(scale.x,scale.y,scale.x);",
        "mPosition += translate.xyz;",
        "gl_Position = projectionMatrix * modelViewMatrix * vec4( mPosition, 1.0 );",
        "}"
    ].join("\n"),
    CylidFShader: [

        "uniform float elapsedTime;",
        "uniform sampler2D u_txue;",
        "uniform vec4 color;",
        "uniform vec2 offset;",

        "varying vec2 vUv;",
        "varying float isT;",
        "varying vec3 tPos;",
        "varying float ratio;",

        //计算渐变值
        "float palneGradualChange( in float dis ){",

        // "vec3 space = vec3(0.2, 0.4, 0.6);",
        "float time = fract(ratio+elapsedTime*offset.x);",
        "vec3 space = vec3(-0.4+time, -0.2+time, 0.0+time);",
        "float disSize = 0.3;",
        "float endSize = 0.8;",

        "float tDis = abs(dis-space.x);",
        "float op = space.x>endSize? 0.0:tDis>=disSize? 0.0:pow(1.0-tDis/disSize, 4.0);",

        "tDis = abs(dis-space.y);",
        "op += space.y>endSize? 0.0:tDis>=disSize? 0.0:pow(1.0-tDis/disSize, 4.0);",

        "tDis = abs(dis-space.z);",
        "op += space.z>endSize? 0.0:tDis>=disSize? 0.0:pow(1.0-tDis/disSize, 4.0);",

        "return op*(endSize-dis)*1.8;",//返回生命值
        "}",

        "void main() { ",

        "vec4 tColor = color;",
        "float dis = length(tPos.xz);",
        "vec2 uv = vec2(vUv.x>1.0?(vUv.x-1.0):vUv.x, vUv.y<0.0?(1.0+vUv.y):vUv.y);",

        "tColor = isT>0.0? vec4(color.rgb, pow(1.0-dis/0.2, 1.0) )*1.2:",//进行发散效果处理
        "isT<0.0? vec4(color.rgb, color.a*palneGradualChange(dis)):",//进行圆环效果处理
        "vec4(color.rgb, (1.0-tPos.y*0.95)*color.a ) * texture2D( u_txue, uv );",//纹理贴图

        "gl_FragColor = tColor;",
        "}"
    ].join("\n")
};
var _Materials = {
    basic: function ( param ) { return new THREE.MeshBasicMaterial( param ); },
    shader: function (param) { return new THREE.ShaderMaterial(param); }//shader自定义材质
};
var _Geometries = {
    buf: function () { return new THREE.BufferGeometry(); },
    insBuf: function () { return new THREE.InstancedBufferGeometry(); }//基础buffer实例几何体
};

//- 默认配置项
var df_Config = {
    line:{
        tagType:'type2',

        colors:['#ffff00'],
        size:10,
        path:'images/particle.png',
        width:4,
        lLength: 60
    },
    tag:{
        type2:{
            zSize: 100,//字体大小
            color:'#ffffff',//字体颜色
            bColor:'rgba(8,8,8,0.5)',//背景颜色
            space: 2,//间距
            borderColor: '#139a8b',//边框颜色
            lineWidth: 5,//边框宽度

            size:100,//大小
            offsetY:10//上升偏移值
        },
        type1:{
            title:{

                color:'#ffff00',//字体颜色
                zSize: 100,//字体大小
                strokeStyle: '#000000',//字体描边色
                lineWidth: 2,//绘制线宽度

                size:4,//大小
                offsetY:0.8//上升偏移值
            },

            zSize: 100,//字体大小
            color:'#ffffff',//字体颜色
            bColor:'rgba(8,8,8,0.5)',//背景颜色
            space: 2,//间距
            borderColor: '#139a8b',//边框颜色
            lineWidth: 5,//边框宽度

            size:100,//大小
            offsetY:10//上升偏移值
        }
    },
    sector:{
        tagType:'type1',

        height: 3.5,
        width: 6,

        lineColor:"#FFFD00",
        lineHeight: 5,
        offsetY: 0.1,

        offset: [0.06,0.05],
        path:'images/sector.png',
        color: "#FFFD00",

        rTop: 0.5,
        rBottom:0.15,
        seg: 32
    }
};

//- 文字标签效果
function createTags(point, config, infor, offsetY){
    //- 位置数据
    var isSector = ("InstancedBufferGeometry" == point.geometry.type);
    var sp = isSector?4:3;
    var pos = isSector? point.geometry.attributes['translate'].array: point.geometry.attributes['position'].array;

    //- 标签对象
    var tags = point.children[point._tagIndex];

    //-
    var tagInfor = config,
        size = tagInfor.size,
        titleInfor = tagInfor.title,
        tSize = titleInfor?titleInfor.size:0;
    //-
    for(var i=0,len=pos.length/sp;i<len;i++){
        //- 数据
        var data = infor[i].data[0].coord[0].value;
        var name = isSector?data:infor[i].name+":"+data;

        // 标签
        var tuex = createCanvasT(config, name);
        var iconText = new THREE.Sprite(new THREE.SpriteMaterial({
            map: tuex,
            depthWrite: false,
            transparent:true
        }));

        var sh = size*tuex._size.h,
            h = pos[i*sp+1]+offsetY + tagInfor.offsetY+sh*.5;
        iconText.scale.set(size*tuex._size.w, sh, 1);
        iconText.position.set(pos[i*sp], h, pos[i*sp+2]);

        iconText.renderOrder = 1;
        tags.add(iconText);

        if(isSector){

            //- 标题
            h += size*tuex._size.h*.5;
            tuex = createCanvasN(config.title, infor[i].name);
            var text = new THREE.Sprite(new THREE.SpriteMaterial({
                map: tuex,
                depthWrite: false,
                transparent:true
            }));

            sh = tSize*tuex._size.h;
            h += titleInfor.offsetY+sh*.5;
            text.scale.set(tSize*tuex._size.w, sh, 1);
            text.position.set(pos[i*sp], h, pos[i*sp+2]);

            text.renderOrder = 1;
            tags.add(text);
        }
    }
}
function ceilPowerOfTwo(value){

    return Math.pow( 2, Math.ceil( Math.log( value ) / Math.LN2 ) );
}
//- 标题
function createCanvasN(config, txt){
    //-
    var font = 'normal bold '+config.zSize+'px arial';
    //-
    var cavs = document.createElement('canvas');
    //-
    var cont = cavs.getContext('2d');

    //- 计算字体宽度和高度
    cont.font = font;
    var _dw = Math.round( cont.measureText( txt ).width );
    var _tw = Math.max( 16, ceilPowerOfTwo( _dw ) ),
        _th = Math.max( 8, ceilPowerOfTwo( config.zSize+2 ) );//上下空隙为1

    //- 画布大小
    cavs.width = _tw;
    cavs.height = _th;

    //- 文字
    cont.textAlign = "center";
    cont.textBaseline = "Bottom";
    //-
    cont.font = font;
    cont.fillStyle = config.color;
    cont.strokeStyle = config.strokeStyle;
    //-
    cont.lineWidth = 1;
    cont.fillText( txt, _tw*0.5, _th*0.9 );
    cont.lineWidth = config.lineWidth;
    cont.strokeText( txt, _tw*0.5, _th*0.9);

    var ratio = _tw/_th;
    var texture = new THREE.Texture(cavs);
    texture.needsUpdate = true;
    texture._size = {
        w: ratio<0?1:ratio,
        h: ratio<0?1/ratio:1
    };

    return texture;
}
//- 标签
function createCanvasT(config, txt){
    //-
    var font = 'normal lighter '+config.zSize+'px arial';
    //-
    var cavs = document.createElement('canvas');
    //-
    var cont = cavs.getContext('2d');

    //- 计算字体宽度和高度
    cont.font = font;
    var _dw = Math.round( cont.measureText( txt ).width )+config.space*2;
    var _tw = Math.max( 16, ceilPowerOfTwo( _dw ) ),
        _th = Math.max( 8, ceilPowerOfTwo( config.zSize+1 ) );//上下空隙为1

    //- 画布大小
    cavs.width = _tw;
    cavs.height = _th;

    var bw = (_tw-_dw)/2;
    //- 背景
    cont.fillStyle = config.bColor;
    cont.fillRect(bw,0,_dw,_th);

    //- 边框
    cont.lineWidth = config.lineWidth;
    cont.strokeStyle=config.borderColor;
    cont.strokeRect(bw,0,_dw,_th);

    // cont.strokeStyle="blue";
    // cont.moveTo(0,_th*0.5);
    // cont.lineTo(_tw,_th*0.5);
    // cont.stroke();

    //- 文字
    cont.textAlign = "center";
    cont.textBaseline = "middle";
    //-
    cont.font = font;
    cont.lineWidth = 1;
    cont.fillStyle = config.color;
    //-
    cont.fillText( txt, _tw*0.5, _th*0.55 );

    var ratio = _tw/_th;
    var texture = new THREE.Texture(cavs);
    texture.needsUpdate = true;
    texture._size = {
        w: ratio<0?1:ratio,
        h: ratio<0?1/ratio:1
    };

    return texture;
}

var markUtil = {

    config: df_Config,
    df_Clock: null,

    //- 平面线效果几何数据
    _index: null,
    _pPoint: null,


//- 设置配置项
    setConfig: function(config){
        //- 融合配置项
        config = config || {};
        this.config = $.extend( true, {}, df_Config, config );
        //-
        this.df_Clock = new THREE.Clock();
        //- 平面线效果几何数据
        this._index = new THREE.Uint16BufferAttribute( [0,1,3, 1,2,3, 4,5,7, 5,6,7], 1 );//索引缓冲对象
        this._pPoint = new THREE.BufferAttribute(new Float32Array([ -0.5,-1,0, 0.5,-1,0, 0.5,0,0, -0.5,0,0, 0,-1,0.5, 0,-1,-0.5, 0,0,-0.5, 0,0,0.5]), 3);//位置缓冲对象
    },

    //- 创建扇形效果
    createSector: function(){
        //- 配置项
        var config = this.config.sector,
            _perimeter = _getPolygonPerimeter(config.seg, config.rTop);

        //- Material
        var color = new THREE.Color(config.color);
        var uniforms = {
            elapsedTime: {value: 0.0},
            height: {value: config.height},
            width: {value: config.width},
            perimeter: {value: _perimeter*0.5},

            color:{value: new THREE.Vector4(color.r,color.g,color.b,1.0)},
            offset: { value: new THREE.Vector2(config.offset[0], config.offset[1]) },
            u_txue: {value: (new THREE.TextureLoader()).load( config.path, function(tex){
                tex.minFilter = THREE.LinearFilter;
            })}
        };
        var cylMat = _Materials.shader({
            uniforms: uniforms,
            transparent: true,
            depthWrite: false,//关闭深度写入
            // depthTest: false,//关闭深度检测
            // blending: THREE.NormalBlending
            vertexShader: _Shaders.CylidVShader,
            fragmentShader: _Shaders.CylidFShader
        });
        //- geo
        var cyGeo = _creatCylGeo(config);//获取geo

        //- 扇形对象
        var mesh = new THREE.Mesh(cyGeo, cylMat);
        mesh.renderOrder = 2;
        mesh.frustumCulled = false;

        //- 扇形对象
        var tMesh = new THREE.Mesh(cyGeo, _Materials.shader({
            uniforms: uniforms,
            transparent: true,
            depthWrite: false,//关闭深度写入
            // depthTest: false,//关闭深度检测
            side: THREE.BackSide,
            vertexShader: _Shaders.CylidVShader,
            fragmentShader: _Shaders.CylidFShader
        }));
        tMesh.name = '扇形对象';
        tMesh.renderOrder = 1;
        tMesh.frustumCulled = false;
        tMesh.add(mesh);

        //- 周期
        tMesh._transTimes = mesh._transTimes = 0;
        tMesh._perTimes = mesh._perTimes = 8;
        //-
        tMesh._animation = mesh._animation = true;

//--------------------------------------------------------------------------------------------------
        //- 连线
        var line = new THREE.LineSegments( new THREE.BufferGeometry(), new THREE.LineDashedMaterial({
            color: config.lineColor,
            dashSize: 3
        }) );
        tMesh.add(line);

//--------------------------------------------------------------------------------------------------

        //- 获取周长
        function _getPolygonPerimeter(n,r){

            return 2*r*n*Math.sin(Math.PI/n);
        }
        //- 扇形几何数据
        function _creatCylGeo(config) {

            // buffers
            var indices = [];
            var vertices = [];
            var normals = [];
            var uvs = [];

            var radialSegments = Math.floor( config.seg ) || 8;
            var heightSegments = 1;

            var thetaStart = 0;
            var thetaLength = Math.PI * 2;

            var radiusTop = config.rTop;
            var radiusBottom = config.rBottom;
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

            _generateCap();
            _planeData();

            var _geo = _Geometries.insBuf();
            _geo.setIndex(indices);
            _geo.addAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
            _geo.addAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ) );
            _geo.addAttribute( 'uv', new THREE.Float32BufferAttribute( uvs, 2 ) );

            function _generateCap() {

                var x, centerIndexStart, centerIndexEnd;
                var vertex = new THREE.Vector3();

                var radius = radiusBottom;
                var sign = 0;

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
                    uvs.push( -1.0, 0.0 );

                    // increase index
                    index ++;
                }
                // generate indices
                for ( x = 0; x < radialSegments; x ++ ) {

                    var i = centerIndexEnd + x;
                    indices.push( i + 1, i, centerIndexStart );
                }
            }

            function _planeData(){

                var centerIndexStart = index;

                vertices.push(-1,0,-1, 1,0,-1, 1,0,1, -1,0,1);
                normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
                uvs.push(-2.0, 0.0, -2.0, 0.0, -2.0, 0.0, -2.0, 0.0);
                index +=4;

                indices.push( centerIndexStart, centerIndexStart+1, centerIndexStart+3 );
                indices.push( centerIndexStart+1, centerIndexStart+2, centerIndexStart+3 );
            }

            return _geo;
        }

        //- 存放标签对象
        tMesh._tagIndex = tMesh.children.length;
        var tags = new THREE.Object3D();
        tags.name = '标签';
        tMesh.add(tags);

        return tMesh;
    },
    //- 更新扇形数据
    updateSectorData: function(mesh, points){
        //- 配置项
        var config = this.config.sector;
        var num = points.length,//计算数量
            height = config.offsetY+config.lineHeight;

        //- 获取geometry对象
        var geometry = mesh.geometry;

        //- buffer对象
        var _translate = new THREE.InstancedBufferAttribute(new Float32Array(num * 4), 4);//位置缓冲对象
        var _position = new THREE.Float32BufferAttribute( new Float32Array(num * 6), 3 );

        //- 循环修改位置数据
        for(var i=0, j=0; i<num; i++){
            //- 位置数据
            var pos = points[i].point;
            var tx = pos.x, ty = pos.y, tz = pos.z;

            _translate.setXYZW(i, tx, ty, tz, Math.random());

            _position.setXYZ(j++, tx, ty+config.offsetY, tz);
            _position.setXYZ(j++, tx, ty+height, tz);
        }

        _translate.needsUpdate = true;//位置缓冲对象更新
        _position.needsUpdate = true;

        //- 将顶点相关缓冲数据添加到attributes中
        geometry.addAttribute("translate", _translate );//位置
        //- 重置个数
        geometry.maxInstancedCount = num;

//------------------------------------------------------------------------
        //- 线对象-将相关数据添加到缓冲对象中
        var geo = mesh.children[1].geometry;
        geo.addAttribute( 'position', _position );
//------------------------------------------------------------------------

        // 标签
        createTags(mesh, this.config.tag[config.tagType], points, height);
    },

    //- 创建连线效果
    createLine: function(){
        //- 配置项
        var config = this.config.line;

        //- build Geometry
        var geo = _Geometries.buf();

        //- 材质
        var material = _Materials.shader({
            uniforms: {
                size: { value: config.size },//大小
                map: { value: (new THREE.TextureLoader()).load( config.path ) }//纹理对象
            },
            transparent: true,//开启透明通道
            depthWrite: false,//关闭深度写入
            depthTest: false,//关闭深度检测

            vertexShader: _Shaders.PointVShader,//顶点着色器
            fragmentShader: _Shaders.PointFShader//片元着色器
        });

        //- 点对象
        var point = new THREE.Points(geo, material);
        point.renderOrder = 2;
        point.name = '连线效果';

//================================================================================================================
        //- buil Geometry（实列几何对象）
        var instancedGeometry = _Geometries.insBuf();

        //- 绑定几何缓存对象数据
        instancedGeometry.index = this._index;//索引值
        instancedGeometry.attributes.position = this._pPoint;//位置数据

        //- 材质
        material = _Materials.shader({
            uniforms: {
                instanceScale:{ value: new THREE.Vector2(config.width, config.lLength) },//缩放值
                center: { value: new THREE.Vector3(-0.25, 0) },//渐变中心点
                power: { value: 4.0 },//内圈渐变倍数
                size: { value: 0.25 },//发散长度x
                sizeX: { value: 0.25 },//分割距离
                sizeY: { value: 1 }//发散长度y
            },
            side:THREE.DoubleSide,//双面绘制
            transparent: true,//开启透明通道
            depthWrite: false,//关闭深度写入
            // depthTest: false,//关闭深度检测

            vertexShader: _Shaders.LineVShader,//顶点着色器
            fragmentShader: _Shaders.LineFShader//片元着色器
        });

        //- 平面线效果对象
        var plane = new THREE.Mesh(instancedGeometry, material);
        plane.frustumCulled = false;//关闭四椎体剪裁
        plane.renderOrder = 1;//粒子对象后绘制
        point.add(plane);//添加到粒子对象中

        //- 存放标签对象
        point._tagIndex = point.children.length;
        var tags = new THREE.Object3D();
        tags.name = '标签';
        point.add(tags);

        return point;
    },
    //- 更新连线数据
    updatePointData: function(mesh, points){
        //- 配置项
        var config = this.config.line;
        var num = points.length;//计算粒子数量

        //- 获取geometry对象
        var geometry = mesh.geometry;

        //- buffer对象
        var _position = new THREE.BufferAttribute(new Float32Array(num * 3), 3),//位置缓冲对象
            _color = new THREE.BufferAttribute(new Float32Array(num * 3), 3);//颜色缓冲对象

        //- 将顶点相关缓冲数据添加到attributes中
        geometry.addAttribute("position", _position );//位置
        geometry.addAttribute("color", _color );//颜色

        //- 计算颜色值
        var colors = [],cL = config.colors.length;//颜色数组
        //- 循环生成颜色对象
        config.colors.forEach(function(col){
            //- 获取颜色值（不包含透明度值）
            colors.push( new THREE.Color(col) );
        });

        //- 线对象
        var instancedGeometry = mesh.children[0].geometry;//线对象的几何对象
        //- 将相关数据添加到缓冲对象中
        instancedGeometry.addAttribute( 'offset', new THREE.InstancedBufferAttribute( _position.array, 3 ) );//偏移值缓冲数据
        instancedGeometry.addAttribute( 'color', new THREE.InstancedBufferAttribute( _color.array, 3 ) );//颜色缓冲数据
        //- 重置个数
        instancedGeometry.maxInstancedCount = num;

        //- 循环修改位置数据
        for(var i=0, c = 0; i<num; i++,c = (c+1)>=cL?0:(c+1)){
            //- 位置数据
            var pos = points[i].point;
            _position.setXYZ(i, pos.x, pos.y+config.lLength, pos.z);
            //- 颜色数据
            var tC = colors[c];
            _color.setXYZ(i, tC.r, tC.g, tC.b);//修改颜色值
        }

        _position.needsUpdate = true;//位置缓冲对象更新
        _color.needsUpdate = true;//更新数据标志位

        instancedGeometry.attributes['offset'].needsUpdate = true;
        instancedGeometry.attributes['color'].needsUpdate = true;

        // 标签
        createTags(mesh, this.config.tag[config.tagType], points, 0);
    },

    //- 动画
    animation: function( mesh ) {

        var dt = this.df_Clock.getDelta();

        mesh.traverseVisible(function(child){
            if(child._animation){

                child.material.uniforms.elapsedTime.value += dt;
            }
        });
    }
};
