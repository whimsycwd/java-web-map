## feature
一般化

1.   上传点文件， 地图文件， 
2.   上传边集合， 可视化上传的集合 
3.   上传轨迹文件， 可视化所上传轨迹
4.	 输入起点坐标， 终点坐标， 规划最短路径
5.	 点击模式， 规划最短路径
6.	 文件格式的定义


具体化的
1.	 可视化了北京数据轨迹

似乎还不是很准确

SMMD

http://zh.wikipedia.org/wiki/%E7%BB%B4%E7%89%B9%E6%AF%94%E7%AE%97%E6%B3%95


最终是单向边吗？



热门路径的规划
热门路径数据

出租车轨迹数据格式阅读

热门路径反应到道路权值



1.	地图不连通。 要处理数据
2.	边的选取






[A\*算法](http://zh.wikipedia.org/wiki/A*%E6%90%9C%E5%AF%BB%E7%AE%97%E6%B3%95)

## ISSUES

1.  Android Layout 无法正常显示
2.  Gradle 依赖编译
3.  http://www.crifan.com/android_studio_debug_osmand_not_run_unable_to_identify_the_apk_for_variant_free_legacy_armv5_debug_and_device/

http://stackoverflow.com/questions/29182833/android-unable-to-identify-the-apk-for-variant-arm-debug-and-device

4.  <strike>OsmAnd编译运行</strike>
5.  OsmAnd地图渲染


把文件存入Android Virtual Device

http://wiki.openstreetmap.org/wiki/OsmAndMapCreator

## Gradle 入门



http://androidforums.com/threads/android-studio-broken-says-missing-class-no-matter-what-project-i-start.917603/


https://code.google.com/p/android/issues/detail?id=170841



## TODO
1.	<strike>后端代码日志</strike>
2.	<strike>后端本地库整理, 把不是maven依赖的东西改成maven依赖</strike>
3.  前段代码重构
4.  <strike>搞清跨域请求</strike> 
5.  换地图贴片服务
6.  更换起点终点坐标. 
7.  清空涂层
8.  alg4的源代码提交到仓库
9.  地图不连通
10. 服务开启时初始化MapAction



## Memo
	http://stackoverflow.com/questions/20751523/removing-leaflet-layers-and-l-marker-method
	https://westcountrydeveloper.wordpress.com/2013/03/25/cross-domain-requests-when-using-jquery-autocomplete/


## Architecture


## Cross Domain Requests

跨域的GET, 和POST请求是不允许的。
会得到下面的结果

```
XMLHttpRequest cannot load http://127.0.0.1:8080/api/map/suggest/?callback=blabla&q=%E6%88%90%E9%83%BD&_=1430982414272. No 'Access-Control-Allow-Origin' header is present on the requested resource. Origin 'http://127.0.0.1:3000' is therefore not allowed access.
```

[JSONP](http://en.wikipedia.org/wiki/JSONP) 借助浏览器允许script标签引入跨域的脚本


[栗子](./frontend/public/experiment/testJSONP.html) 

JSONP的原理是定义一个本地的函数callbackFunc()，
然后把get请求当成script的src来请求。 这时候返回的jsonp

```
callbackFunc({JSON-OBJECT})
```
如此浏览器便会去执行callbackFunc(), 从而达到跨域请求数据的目的

#### Reference

1. 	https://westcountrydeveloper.wordpress.com/2013/03/25/cross-domain-requests-when-using-jquery-autocomplete/
2.	http://en.wikipedia.org/wiki/JSONP

## Tech & Resource


-	map dataset : https://www.openstreetmap.org/
-	frontend js library : http://leafletjs.com/
-	backend :  Java, Spring + Jersey 
- 	调查了这个项目， 但是最终没有使用， 只使用读取xml的代码 https://processing.org/
- 	





## Logging

http://logback.qos.ch/

### Step by step tutorial to integrate web app
	https://wiki.base22.com/display/btg/How+to+setup+SLF4J+and+LOGBack+in+a+web+app+-+fast




## RESTful Interface


base url : /api/tool

### 1. Find nearest point

`nearest/{lng}/{lat}`

### 2. Routing  

`/routing/{sId}/{tId}`

### 3.on

base url : /api/map

### 1. Find nearest point


<strike>`/nearest/{coordinateX}/{coordinateY}`</strike>

`/nearest/{lat}/{lon}`

####Example 
#####Request

	http://127.0.0.1:3000/api/map/nearest/104.0834872/30.6834598


#####Response 
```
{
    "id": 1947584056, 
    "x": 104.0834872, 
    "y": 30.6834598
}
```

###  2. Get suggest name candidates

`/suggest`

#### Example

##### Request 
	http://127.0.0.1:8080/api/map/suggest/?callback=jQuery111208834337801672518_1430982414266&q=%E6%88%90%E9%83%BD&_=1430982414272

##### Response

	jQuery111208834337801672518_1430982414266(["成都2.5环路","成都49中","成都七中实验学校","成都七中育才学校","成都七中育才学校（新校区）","成都万贯服装产业园","成都东客站 East Railway Station","成都东方明珠花园","成都东站","成都中电锦江信息产业有限公司","成都二仙桥派出所"])

###  3. find nodes that match the names.

`/findNodes/{queryStr}`

#### Example

##### Request 
	http://127.0.0.1:3000/api/map/findNodes/%E6%98%9F%E5%B7%B4%E5%85%8B

##### Response
```
[{"x":104.0654934,"y":30.6601337},{"x":104.064139,"y":30.60451},{"x":104.0593122,"y":30.6500798},{"x":104.0460577,"y":30.6156397},{"x":104.0825538,"y":30.6483154},{"x":104.0884452,"y":30.6448503},{"x":104.090872,"y":30.6159933}]
```

###  2. Routing

`/routing/{sId}/{tId}`

#### Example


##### Request 
	http://127.0.0.1:3000/api/map/routing/803147935/314622911
##### Response
```
{"paths":[{"x":104.0850575,"y":30.6415535},{"x":104.0847193,"y":30.6413739},{"x":104.0835382,"y":30.6408278},{"x":104.0817034,"y":30.6399796},{"x":104.0804458,"y":30.6394197},{"x":104.0786381,"y":30.638549},{"x":104.0780484,"y":30.6382719},{"x":104.077451,"y":30.6379912},{"x":104.0739046,"y":30.6363245},{"x":104.0736149,"y":30.6361583},{"x":104.0726761,"y":30.6361412},{"x":104.0708032,"y":30.6360332},{"x":104.0703782,"y":30.6360378},{"x":104.068662,"y":30.6359848},{"x":104.0668757,"y":30.635953},{"x":104.065395,"y":30.6358888},{"x":104.0647125,"y":30.6359698},{"x":104.0643158,"y":30.6359627},{"x":104.064222,"y":30.6359627},{"x":104.0641099,"y":30.6359644},{"x":104.0639924,"y":30.6359641},{"x":104.0636329,"y":30.6359578},{"x":104.062715,"y":30.6358983},{"x":104.061357,"y":30.6358521},{"x":104.0586239,"y":30.6358145},{"x":104.0584183,"y":30.6358076},{"x":104.0573059,"y":30.6357703},{"x":104.0559777,"y":30.6357258},{"x":104.0537407,"y":30.6356935},{"x":104.0528663,"y":30.6356474},{"x":104.052362,"y":30.6356381}]}
```