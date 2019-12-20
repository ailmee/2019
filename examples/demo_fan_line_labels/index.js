function() {
    return {
        //组件初始化
        "init" : function(options) {
            this._super.apply(this,arguments);
        },
        'selectNodes':function(selectors,callback){
            var i = 0,len = selectors.length,targets = new Array(),arg = arguments,self = this;
            for(;i<len;i++){
                var target = tinyWidget.util.getWidgetById(selectors[i]);
                if(!target) return setTimeout(function(){
                    arg.callee.apply(self,arg);
                },0);
                targets.push(target);
            }
            callback && typeof callback == 'function' && callback.call(self,targets);
        },//主要配置
        'setSVG':function(id,callback){
            this.selectNodes([id],function(targets){
                this.afterCreated(targets[0],function(svg){
                    this.needRun = [];
                    var self = this;
                    callback&&callback.call(this,this.needRun,svg);
                    svg._svgRender.onRender('svg_extension',function(){
                        self.needRun.forEach(function(item){
                            item();
                        })
                    });
                });
            });
        },
        'afterCreated':function(svg,callback){
            var render = svg._svgRender,self = this;
            var createSVGMap = svg.createSVGMap;
            svg.createSVGMap = function(){
                createSVGMap.apply(this,arguments);
                callback&&callback.call(self,svg);
            }
            if(svg.pointMap){
                callback&&callback.call(self,svg);
            }
        },

        //容器内所有组件加载完成
        "allChildrenLoaded": function(){
            var svgId = 'a15740795013841';//-svg组件ID

            //- 设置配置项
            markUtil.setConfig({
                line:{
                    tagType:'type2',

                    colors:['#16fff0'],
                    size: 90,
                    path:'attach/images/particle.png',
                    width: 18,
                    lLength: 28
                },
                tag:{
                    type2:{
                        zSize: 100,//字体大小
                        color:'#ffffff',//字体颜色
                        space: 50,//间距
                        borderColor: '#14c4b5',//边框颜色
                        lineWidth: 6,//边框宽度

                        size:5,//大小
                        offsetY:2//上升偏移值
                    },
                    type1:{
                        title:{

                            color:'#ffffff',//字体颜色
                            zSize: 100,//字体大小
                            strokeStyle: '#000000',//字体描边色
                            lineWidth: 2,//绘制线宽度

                            size:6,//大小
                            offsetY:0.9//上升偏移值
                        },

                        zSize: 100,//字体大小
                        color:'#ffff00',//字体颜色
                        borderColor: '#ffff00',//边框颜色
                        lineWidth: 5,//边框宽度
                        space: 200,//间距

                        size:3.5,//图片大小
                        offsetY:0.4//图片上升偏移值
                    }
                },
                sector:{
                    tagType:'type1',

                    height: 10,
                    width: 14,

                    lineColor:"#E1FF32",
                    lineHeight: 18,
                    offsetY: 0.2,

                    offset: [0.06,0.05],
                    path:'attach/images/sector.png',
                    color: "#FFFD00",

                    rTop: 0.5,
                    rBottom:0.15,
                    seg: 32
                }
            });

            this.setSVG(svgId, function(loop, svg){
                var svgRd = svg._svgRender;
                var isFirst = true;

                //扇形效果对象
                var sector = markUtil.createSector();
                sector.visible = false;
                //连线效果对象
                var line = markUtil.createLine();
                line.visible = false;

                //svgRd.onRender("svg_extension")
                loop.push(function () {

                    var layer = svgRd.SVGMapLayers;
                    var datas = svgRd.LayersArray;

                    function updateData(obj){

                        obj.updateMatrixWorld(true);
                        obj._isChanged = true;//置为已经更新状态
                        var points = [];

                        //- series
                        var series = datas[obj.LayerID].series;

                        obj.children.forEach(function(child){

                            if(child._name && child._name.length){

                                var infor = series[child.SerieID];

                                var point = (child.children[0].children[0].geometry.vertices)[0].clone();
                                points.push({
                                    point: point.applyMatrix4(obj.matrixWorld),
                                    data: infor.data,
                                    name: infor.name
                                });
                            }
                        });

                        return points;
                    }

                    if(layer){

                        if(isFirst){
                            svgRd.scene.add(sector, line);
                            isFirst = false;
                        }

                        //- 扇形标注
                        if(layer.children[0] && !layer.children[0]._isChanged) {

                            //-
                            var points = updateData(layer.children[0]);

                            //- 更新扇形对象数据
                            markUtil.updateSectorData(sector, points);
                            sector.visible = true;
                        }
                        //- 连线标注
                        if(layer.children[1] && !layer.children[1]._isChanged) {

                            //-
                            var points = updateData(layer.children[1]);

                            //- 更新扇形对象数据
                            markUtil.updatePointData(line, points);
                            line.visible = true;
                        }

                    }

                    markUtil.animation(sector);
                });
            });
        }
    };
}