import processing.core.*; 
import processing.data.*; 
import processing.event.*; 
import processing.opengl.*; 

import processing.pdf.*; 
import controlP5.*; 
import java.util.Arrays; 
import java.util.LinkedList; 
import java.util.Queue; 

import java.util.HashMap; 
import java.util.ArrayList; 
import java.io.File; 
import java.io.BufferedReader; 
import java.io.PrintWriter; 
import java.io.InputStream; 
import java.io.OutputStream; 
import java.io.IOException; 

public class map_project extends PApplet {




PanZoomController panZoomController;
ControlP5 cp5;
Textarea status;
Println console;
PFont font;
PImage guide, init;
Map map;
PImage map_img;
final int max_zoom = 16;
boolean pic_output = false;

int path_start,path_end;
IntList short_path,short_path_a;
boolean new_path;// SP

IntList path;
String map_name;
boolean first;
boolean in_selection;

public void setup() { //init
  size(1024,600);
  cp5 = new ControlP5(this);
  cp5.enableShortcuts();
  status = cp5.addTextarea("txt")
              .setPosition(724,500)
              .setSize(300,100)
              .setFont(createFont("arial",12))
              .setLineHeight(14)
              .setColor(color(0))
              .setColorBackground(color(255,150))
              .setColorForeground(color(255,100));
              ;
  console = cp5.addConsole(status);

  panZoomController = new PanZoomController(this);
  panZoomController.setPan(new PVector(0,0));
  panZoomController.setFinalPan(new PVector(0,0));
  panZoomController.setScale(1);
  panZoomController.setFinalScale(1);
  panZoomController.setMaxLogScale(4);

  background(255);
  int font_time = millis();
  font = loadFont("MicrosoftYaHeiMono-14.vlw");
  textFont(font);
  println("Font load :",(millis()-font_time)/1000.0f," sec");

  map = null;
  map_name = null;

  guide = loadImage("guide.png");
  init = loadImage("init0.png");
  in_selection = false;
}

public void draw()
{
  if(map == null){ //\u6587\u4ef6\u8f93\u5165
    if(map_name != null){ 
      path_start = path_end = -1;
      new_path = false;
      map = new Map(map_name);
      int drawing_time = millis();
      map.draw_map("map.jpg", width*max_zoom, height*max_zoom);
      println("Draw time: ",(millis()-drawing_time)/1000.0f," sec");
      map_img = loadImage("map.jpg");
      panZoomController.setPan(new PVector(0,0));
      panZoomController.setScale(0);
      redraw();
    }
    else{
      image(init,0,0);
      path_start = path_end = -1;
      new_path = false;
      if(!in_selection && (mousePressed || keyPressed)){
        selectInput("Select a file to process:", "fileSelected");
        in_selection = true;
      }
    }
  }
  else{ //\u7ed8\u56fe
    background(255);
    if(path_start != -1 && path_end != -1 && new_path){ // renew path
      new_path = false;
      int sp_time = millis();
      short_path = map.pathDij(path_start, path_end);
      println("ShortPath time: ",(millis()-sp_time)/1000.0f," sec");
      // sp_time = millis();
      // short_path_a = map.path(path_start, path_end);
      // println("ShortPath time: ",(millis()-sp_time)/1000.0," sec");
    }
    panZoomController.relax();
    PVector p = panZoomController.getPan();
    PVector t = new PVector(mouseX, mouseY);
    pushMatrix();
    translate(p.x,p.y);
    scale(panZoomController.getScale()/max_zoom);
    image(map_img,0,0);
    popMatrix();
    map.curBox.pan(p);
    map.curBox.scale(panZoomController.getScale());
    map.draw_map();
    map.draw_way(short_path,0);
    // map.draw_way(short_path_a,#ffff00);
    map.draw_node(path_start,0xff00FF00,5);
    map.draw_node(path_end  ,0xffFF0000,5);
    image(guide,0,0);
    // noLoop();
  }
}

public void fileSelected(File selection) {
  if (selection == null) {
    println("Window was closed or the user hit cancel.");
    in_selection = false;
  } else {
    println("User selected " + selection.getAbsolutePath());
    map_name = selection.getAbsolutePath();
    in_selection = false;
  }
}

public void mouseClicked(){
  if(map != null && map_name != null){
    PVector p = panZoomController.getPan();
    PVector t = new PVector(mouseX, mouseY);
    t.sub(p);
    t.div(panZoomController.getScale());
    if(mouseButton == LEFT){
      new_path = true;
      int find_time = millis();
      path_start = map.find_node_in_way(t);
      println("Find time: ",(millis()-find_time)/1000.0f," sec");
    }
    if(mouseButton == RIGHT){
      new_path = true;
      int find_time = millis();
      path_end = map.find_node_in_way(t);
      println("Find time: ",(millis()-find_time)/1000.0f," sec");
    }
  }
}

public void keyPressed() {
  if(key == CODED && panZoomController != null){
    if(keyCode == UP || keyCode == DOWN || keyCode == LEFT || keyCode == RIGHT ) {
      panZoomController.keyPressed();
    }
    else if(keyCode == 33){ // PAGE UP
      panZoomController.mouseWheel(1);
    }
    else if(keyCode == 34){ //PAGE DOWN
      panZoomController.mouseWheel(-1);
    }
    else if(keyCode == 36){ //HOME
      panZoomController.setFinalPan(new PVector(0,0));
      panZoomController.setFinalScale(1);
    }
    else if(keyCode == 35){ //END
      map = null;
      map_name = null;
    }
  }
}

public void mouseDragged() {
  if(!(mouseX>824 && mouseY>500))
    panZoomController.mouseDragged();
}

public void mouseWheel() {
}





float inf = 99999999999f; 

class Box {

  PVector min_v, max_v;
  PVector origin_delta,delta;

  Box(float minx, float maxx, float miny, float maxy){
    min_v = new PVector(minx,miny);
    max_v = new PVector(maxx,maxy);
    delta = PVector.sub(max_v,min_v);
    origin_delta = delta;
  }

  public void pan(PVector t){ 
    min_v = t;
    max_v = PVector.add(min_v,delta);
  }

  public void scale(float t){ // use for view zooming
    delta = PVector.mult(origin_delta,t);
    max_v = PVector.add(min_v,delta);
  }

  public boolean includeVector(PVector t){
    if(min_v.x < t.x && t.x <= max_v.x && min_v.y < t.y && t.y <= max_v.y)
      return true;
    else
      return false;
  }

  public boolean in(Box t){ //check if this is in t
    if(includeVector(min_v) ||
       includeVector(max_v) ||
       includeVector(new PVector(min_v.x,max_v.y)) ||
       includeVector(new PVector(max_v.x,min_v.y)))
      return true;
    else
      return false;
  }

};

class Tag {

  String k,v;

  Tag(String k, String v){
    this.k = k;
    this.v = v;
  }

};

public PVector linear_map(float x, float y, Box r, Box d){// calc the linear transfrom factor

  float rate = min(d.delta.x/r.delta.x,d.delta.y/r.delta.y);
  PVector ret = new PVector(x,y);
  ret.sub(r.min_v);
  ret.mult(rate);
  ret.x = -ret.x; //from geo to screen
  ret.add(d.min_v);
  return ret;

}

public void dash_line(float x0, float y0, float x1, float y1, float spacing, float mainWidth){

  float distance = dist(x0, y0, x1, y1);
  float xSpacing;
  float ySpacing;
  float drawn = 0.0f;
  pushStyle();

  strokeCap(SQUARE);
  strokeWeight(mainWidth);

  if (distance > 0){
    boolean drawLine = true;

    xSpacing = lerp(0, (x1 - x0), spacing / distance);
    ySpacing = lerp(0, (y1 - y0), spacing / distance);

    int i = 0;
    while (drawn < distance){
      if (drawLine){
        line(x0, y0, x0 + xSpacing, y0 + ySpacing);
      }
      x0 += xSpacing;
      y0 += ySpacing;
      drawn = drawn + mag(xSpacing, ySpacing);
      i = i + 1;
      drawLine = !drawLine;
    }
  }
  popStyle();

}

class Edge implements Comparable {

  int u;
  int v;
  float w;

  Edge(){
    u = v = 0;
    w = 0;
  }

  Edge(int u, int v, float w){
    this.u = u;
    this.v = v;
    this.w = w;
  }

  public int compareTo(Object o){
    int p = ((Edge)o).u;
    return (p == u)? 0 : (p < u ? 1 : -1);
  }

};

class HeapNode{
  int index;
  float f;

  HeapNode(int i, float f){
    index = i;
    this.f = f;
  }

  public boolean less_than(HeapNode t){
    return f < t.f;
  }
};

class Heap{

  HeapNode[]  heap;
  // int[] pos;
  int len;
  int size;
  int DIM = 4;
  int LOGDIM = 2;

  Heap(int size){
    this.size = size;
    heap = new HeapNode[size];
    // pos = new int[size];
    len = 0;
  }

  public void up(int index){
    int next = index >> LOGDIM;
    while(index > 0 && heap[index].less_than(heap[next])){
      HeapNode t = heap[index];
      heap[index] = heap[next];
      heap[next] = t;
      // pos[heap[index].index] = index;
      // pos[heap[next].index] = next;
      index = next;
      next = next >> LOGDIM;
    }
    // pos[heap[index].index] = index;
    // pos[heap[next].index] = next;
  }

  public void down(int index){
    while(index < len){
      int cur = (index<<LOGDIM) + 1;
      int next = cur;
      if(cur >= len) return;
      for(int i=0; i<DIM; i++)
      if(cur + i < len && heap[cur + i].less_than(heap[next])){
        next = cur + i;
      }
      if(heap[next].less_than(heap[index])){
        HeapNode t = heap[index];
        heap[index] = heap[next];
        heap[next] = t;
        // pos[heap[index].index] = index;
        // pos[heap[next].index] = next;
        index = next;
      }
      else {
        // pos[heap[index].index] = index;
        // pos[heap[next].index] = next;
        return ;
      }
    }
  }

  public void pop(){
    heap[0] = heap[len-1];
    len--;
    down(0);
  }

  public void push(int index, float f){
    heap[len] = new HeapNode(index,f);
    len++;
    up(len-1);
  }

  // boolean change(int index, float f){
  //   if(pos[index] >= 0 && pos[index] < len){
  //     heap[pos[index]].f = f;
  //     return true;
  //   }
  //   return false;
  // }

  public int size(){
    return len;
  }

  public HeapNode top(){
    return heap[0];
  }

  public boolean empty(){
    return len <= 0;
  }

};

class TableNode implements Comparable {

  float id;
  int index;

  TableNode(float id, int index){
    this.id = id;
    this.index = index;
  }

  public int compareTo(Object o){
    float p = ((TableNode)o).id;
    return (p == id)? 0 : (p < id ? 1 : -1);
  }

};


class TableEps{ // index of Node

  TableNode[] table;
  int len;

  TableEps(Node[] node){
    len = node.length;
    table = new TableNode [len];
    for(int i=0; i<len; i++){
      table[i] = new TableNode(node[i].x,i);
    }
    Arrays.sort(table);
  }

  // \u4e8c\u5206\u67e5\u627e \u6839\u636e\u6240\u7ed9\u7684 k
  public int find(float k){
    int low = 0, high = len-1;
    int mid = (high + low) >> 1;
    while(low < high - 1){
      mid = (high + low) >> 1;
      if(k > table[mid].id)
        low = mid;
      else
        high = mid;
    }
    return mid;
  }

  // \u4e8c\u5206\u67e5\u627e \u6839\u636e\u6240\u7ed9\u7684 k \u5728 eps \u4e2d
  public IntList find(float l, float r, float k, float eps){ // both l, r, k are lat

    int low = find(k-eps), high = find(k+eps);

    IntList ret = new IntList();
    for(int i=low; i<=high; i++){
      ret.append(table[i].index);
    }
    return ret;
  }//Useage nodeT.find(nd[index].getString("ref"));

  public int find_index(float x){
    return table[find(x)].index;
  }

  public void print_debug(float k){
    int pos = find(k);
    for(int i=0;i<len;i++){
      if(i == pos) print(">>>>");
      println(table[i].id, table[i].index);
    }
  }
};
class Map{

  Box geoBox,curBox,limBox;
  Node[] node;
  Way[] way;
  Edge[] edge; int[] star; //SPFA
  Relation[] relation;
  
  PGraphics text_layer, map_buf; 
  float str_h=textAscent() + textDescent(); // text box , with delta
  int text_delta = 30;
  Tree index_tree;
  // TableEps node_index;
  // Box[] wayBox;
  // Table nodeT,wayT;
  // WayScaleTable wayScaleT;

  int TREE_DIM = 4;
  int UL = 0, UR = 1, DL = 2, DR = 3;
  class Tree{
    Tree[] son = new Tree[TREE_DIM];
    int index = -1;
    Tree(int i){
      index = i;
    }

    Tree(Box b, IntList index_list){
      if(index_list.size() <= 1){
        index = index_list.get(0);
        return ;
      }
      IntList[] list = new IntList[TREE_DIM];
      int i;
      for(i=0; i<TREE_DIM; i++){
        list[i] = new IntList();
      }
      Box[] box = new Box[TREE_DIM];
      b.scale(0.5f);
      box[UL] = new Box(b.min_v.x, b.max_v.x, b.min_v.y, b.max_v.y);
      box[UR] = new Box(b.min_v.x + b.delta.x, b.max_v.x + b.delta.x, b.min_v.y            , b.max_v.y            );
      box[DL] = new Box(b.min_v.x            , b.max_v.x            , b.min_v.y + b.delta.y, b.max_v.y + b.delta.y);
      box[DR] = new Box(b.min_v.x + b.delta.x, b.max_v.x + b.delta.x, b.min_v.y + b.delta.y, b.max_v.y + b.delta.y);
      for(i=0;i<index_list.size();i++){
        if(box[UL].includeVector(node[index_list.get(i)].coordinate)){
          list[UL].append(index_list.get(i));
          node[index_list.get(i)].c = 0xffff0000;
        }
        else if(box[UR].includeVector(node[index_list.get(i)].coordinate)){
          list[UR].append(index_list.get(i));
          node[index_list.get(i)].c = 0xff00ff00;
        }
        else if(box[DL].includeVector(node[index_list.get(i)].coordinate)){
          list[DL].append(index_list.get(i));
          node[index_list.get(i)].c = 0xff0000ff;
        }
        else if(box[DR].includeVector(node[index_list.get(i)].coordinate)){
          list[DR].append(index_list.get(i));
          node[index_list.get(i)].c = 0xffffff00;
        }
      }

      // for(i=0; i<TREE_DIM; i++){
      //   println("=====",i,"=======");
      //   println(box[i].min_v, box[i].max_v);
      //   if(list[i].size() < 10)
      //   println(list[i]);
      // }

      for(i=0; i<TREE_DIM; i++){
        if(list[i].size() > 0){
          if(list[i].size() != index_list.size())
            son[i] = new Tree(box[i],list[i]);
          else
            son[i] = new Tree(list[i].get(0));
        }
      }
    }

    public int find(Box b, float x, float y){
      if(index > 0)
        return index;
      int i;
      PVector p = new PVector(x,y);
      Box[] box = new Box[TREE_DIM];
      b.scale(0.5f);
      box[UL] = new Box(b.min_v.x, b.max_v.x, b.min_v.y, b.max_v.y);
      box[UR] = new Box(b.min_v.x + b.delta.x, b.max_v.x + b.delta.x, b.min_v.y            , b.max_v.y            );
      box[DL] = new Box(b.min_v.x            , b.max_v.x            , b.min_v.y + b.delta.y, b.max_v.y + b.delta.y);
      box[DR] = new Box(b.min_v.x + b.delta.x, b.max_v.x + b.delta.x, b.min_v.y + b.delta.y, b.max_v.y + b.delta.y);
      for(i=0;i<TREE_DIM;i++){
        if(son[i] != null && box[i].includeVector(p)){
          return son[i].find(box[i], p.x, p.y);
        }
      }
      for(i=0;i<TREE_DIM;i++){
        if(son[i] != null)
          return son[i].find(box[i], p.x, p.y);
      }
      return -1;
    }

    public int deep()
    {
      int ret = 0,i;
      for(i=0;i<TREE_DIM;i++)
      {
        if(son[i] != null)
        ret = max(ret ,son[i].deep() + 1);
      }
      return ret;
    }
  };

  Map(String map_name){

    int loading_start = millis();
    XML map_data = loadXML(map_name);
    XML bounds = map_data.getChild("bounds");
    XML[] node = map_data.getChildren("node");
    XML[] way = map_data.getChildren("way");
    XML[] relation = map_data.getChildren("relation");

    println("Load XML: ",(millis() - loading_start)/1000.0f,"sec");

    println("start build");

    int build_start = millis();

    geoBox = new Box(bounds.getFloat("minlon"), bounds.getFloat("maxlon"), 
                      bounds.getFloat("maxlat"), bounds.getFloat("minlat"));
    curBox = new Box(0,width,0,height);
    limBox = curBox;

    if(geoBox.delta.x < 0.4f){
      println("small graph");
      for(int i=0;i<6;i++){
        LIM[i] = 1;
        GAP[i] = 0;
      }
      ROAD_WIDTH = 5;
    }

    this.node = new Node[node.length];
    for(int i=0; i<node.length; i++){
      this.node[i] = new Node(Long.parseLong(node[i].getString("id")), node[i]);
    }
    println("Graph V = ",node.length);
    Arrays.sort(this.node);
    //Node List

    int cnt = 0;
    this.way = new Way[way.length];
    for(int i=0; i<way.length; i++){
      this.way[i] = new Way(Long.parseLong(way[i].getString("id")), way[i]);
      this.way[i].index[0] = search_node(this.way[i].nd[0]);
      this.way[i].coordinate[0] = new PVector(this.node[this.way[i].index[0]].x, this.node[this.way[i].index[0]].y);
      PVector cur = linear_map(this.way[i].coordinate[0].x, this.way[i].coordinate[0].y, geoBox, curBox); 
      this.node[this.way[i].index[0]].coordinate = cur;
      PVector next;
      for(int j=1;j<this.way[i].nd.length;j++){
        if(this.way[i].is_way)
          cnt++;
        this.way[i].index[j] = search_node(this.way[i].nd[j]);
        this.way[i].coordinate[j] = new PVector(this.node[this.way[i].index[j]].x, this.node[this.way[i].index[j]].y);
        next = linear_map(this.way[i].coordinate[j].x, this.way[i].coordinate[j].y, geoBox, curBox);
        this.node[this.way[i].index[j]].coordinate = next;
        this.way[i].d[j] = PVector.sub(next, cur);
        this.way[i].d[j].normalize();
        this.way[i].d[j].rotate(HALF_PI);
        if(this.way[i].is_area){
          this.way[i].priority -= cur.x*next.y - next.x*cur.y;
        }
        cur = next;
      }
      if(this.way[i].is_area && this.way[i].priority > 0){
        this.way[i].priority = -this.way[i].priority;
      }
    }
    println("Graph E = (only highway)",cnt);

    Arrays.sort(this.way);
    //Way List

    IntList index_list = new IntList();
    for(int i=0;i<way.length;i++){
      if(this.way[i].is_way)
        for(int j=0;j<this.way[i].nd.length;j++){
          index_list.append(this.way[i].index[j]);
        }
    }
    index_tree = new Tree(curBox,index_list);
    println("Tree Depth : ",index_tree.deep());

    edge = new Edge[cnt*2];
    for(int i=0,len=0; i<way.length; i++){
      if(!this.way[i].is_way) continue;
      for(int j=1; j<this.way[i].index.length; j++){
        edge[len] = new Edge();
        edge[len].u = this.way[i].index[j-1];
        edge[len].v = this.way[i].index[j];
        PVector cur = linear_map(this.way[i].coordinate[j-1].x, this.way[i].coordinate[j-1].y, geoBox, curBox);
        PVector next = linear_map(this.way[i].coordinate[j].x, this.way[i].coordinate[j].y, geoBox, curBox);
        // edge[len].w = (PVector.sub(cur,next)).mag()/(this.way[i].speed_limit);
        edge[len].w = (PVector.sub(cur,next)).mag();
        len++;

        edge[len] = new Edge();
        edge[len].u = this.way[i].index[j];
        edge[len].v = this.way[i].index[j-1];
        if(this.way[i].one_way)
          edge[len].w = inf;
        else
          edge[len].w = edge[len-1].w;
        len++;
      }
    }
    Arrays.sort(edge);

    star = new int[node.length+1];
    star[0] = edge[0].u;
    for(int i=1;i<cnt*2;i++){
      if(edge[i].u != edge[i-1].u)
        star[edge[i].u] = i;
    }
    star[edge[cnt].u+1] = cnt*2;
    for(int i=node.length-1; i>=0; i--){
      if(star[i] == 0)
        star[i] = star[i+1];
    }

    this.relation = new Relation[relation.length];
    for(int i=0; i<relation.length; i++){
      this.relation[i] = new Relation(Long.parseLong(relation[i].getString("id")), relation[i]);
    }
    Arrays.sort(this.relation);

    text_layer = createGraphics(width,height);
    map_buf = createGraphics(width*max_zoom,height*max_zoom);

    println("Build time :",(millis()-build_start)/1000.0f," sec");
  }
  
  public int search_node(long index){
    return Arrays.binarySearch(node, new Node(index, (XML)null));
  }

  public int search_way(long index){
    return Arrays.binarySearch(node, new Node(index, (XML)null));
  }

  public void draw_way(int i){
    pushStyle();

    float scale = panZoomController.getScale();
    PVector[] cur_pt = new PVector[way[i].nd.length];
    // String name = way[i].get_name();
    float sideWidth = way[i].sideWidth;
    float mainWidth = way[i].mainWidth;
    float halfMianWidth = mainWidth/2;

    cur_pt[0] = linear_map(this.way[i].coordinate[0].x, this.way[i].coordinate[0].y, geoBox, curBox); 
    if(!curBox.includeVector(cur_pt[0])){
      return ;
    }
    if(scale < way[i].zoom_limit){
      if(scale < way[i].fade_out)
        return;
      else{
        float tmp = (scale-way[i].fade_out)/(way[i].zoom_limit - way[i].fade_out);
        sideWidth = way[i].sideWidth*tmp;
        mainWidth = way[i].mainWidth*tmp;
        halfMianWidth = mainWidth/2;
      }
    }

    if(way[i].is_dash){  // is dash
      stroke(way[i].mainColor);
      strokeWeight(mainWidth);
      for(int j=1; j<way[i].nd.length; j++){
        cur_pt[j] = linear_map(way[i].coordinate[j].x, way[i].coordinate[j].y, geoBox, curBox); 
        dash_line(cur_pt[j-1].x, cur_pt[j-1].y, cur_pt[j].x, cur_pt[j].y, way[i].dash_len, mainWidth);
      }
    }
    else{
      stroke(way[i].mainColor);
      strokeWeight(mainWidth);
      for(int j=1; j<way[i].nd.length; j++){
        cur_pt[j] = linear_map(way[i].coordinate[j].x, way[i].coordinate[j].y, geoBox, curBox); 
        line(cur_pt[j-1].x, cur_pt[j-1].y, cur_pt[j].x, cur_pt[j].y);
      }
    }
    
    if(way[i].sideWidth > 0){ //draw bounds.. a bit slow
      PVector[] d = new PVector[way[i].nd.length];
      stroke(way[i].sideColor);
      strokeWeight(sideWidth);
      for(int j=1; j<way[i].nd.length; j++){
        d[j] = new PVector(way[i].d[j].x, way[i].d[j].y);
        d[j].mult(halfMianWidth);
        line(cur_pt[j-1].x - d[j].x, cur_pt[j-1].y - d[j].y, cur_pt[j].x - d[j].x, cur_pt[j].y - d[j].y);
      }
      for(int j=1; j<way[i].nd.length; j++){
        line(cur_pt[j-1].x + d[j].x, cur_pt[j-1].y + d[j].y, cur_pt[j].x + d[j].x, cur_pt[j].y + d[j].y);
      }
    }

    popStyle();
  }

  public void draw_area(int i){
    // String name = way[i].get_name();
    PVector centor = new PVector(0, 0);
    pushStyle();
    noStroke();
    beginShape();
    fill(way[i].mainColor);
    for(int j=0; j<way[i].nd.length; j++){
      PVector cur = linear_map(way[i].coordinate[j].x, way[i].coordinate[j].y, geoBox, curBox); 
      vertex(cur.x,cur.y);
      centor.add(cur);
    }
    endShape();
    popStyle();
  }

  public void draw_way_in_buf(int i){
    map_buf.pushStyle();

    float scale = 1;
    PVector[] cur_pt = new PVector[way[i].nd.length];
    float sideWidth = way[i].sideWidth;
    float mainWidth = way[i].mainWidth;
    float halfMianWidth = mainWidth/2;

    cur_pt[0] = linear_map(this.way[i].coordinate[0].x, this.way[i].coordinate[0].y, geoBox, curBox); 
    if(!curBox.includeVector(cur_pt[0])){
      return ;
    }
    if(scale < way[i].zoom_limit){
      if(scale < way[i].fade_out)
        return;
      else{
        float tmp = (scale-way[i].fade_out)/(way[i].zoom_limit - way[i].fade_out);
        sideWidth = way[i].sideWidth*tmp;
        mainWidth = way[i].mainWidth*tmp;
        halfMianWidth = mainWidth/2;
      }
    }

    if(way[i].is_dash){  // is dash
      map_buf.stroke(way[i].mainColor);
      map_buf.strokeWeight(mainWidth);
      for(int j=1; j<way[i].nd.length; j++){
        cur_pt[j] = linear_map(way[i].coordinate[j].x, way[i].coordinate[j].y, geoBox, curBox); 
        map_buf.line(cur_pt[j-1].x, cur_pt[j-1].y, cur_pt[j].x, cur_pt[j].y);
      }
    }
    else{
      map_buf.stroke(way[i].mainColor);
      map_buf.strokeWeight(mainWidth);
      for(int j=1; j<way[i].nd.length; j++){
        cur_pt[j] = linear_map(way[i].coordinate[j].x, way[i].coordinate[j].y, geoBox, curBox); 
        map_buf.line(cur_pt[j-1].x, cur_pt[j-1].y, cur_pt[j].x, cur_pt[j].y);
      }
    }

    if(way[i].sideWidth > 0){ //draw bounds.. a bit slow
      PVector[] d = new PVector[way[i].nd.length];
      map_buf.stroke(way[i].sideColor);
      map_buf.strokeWeight(sideWidth);
      for(int j=1; j<way[i].nd.length; j++){
        d[j] = new PVector(way[i].d[j].x, way[i].d[j].y);
        d[j].mult(halfMianWidth);
        map_buf.line(cur_pt[j-1].x - d[j].x, cur_pt[j-1].y - d[j].y, cur_pt[j].x - d[j].x, cur_pt[j].y - d[j].y);
      }
      for(int j=1; j<way[i].nd.length; j++){
        map_buf.line(cur_pt[j-1].x + d[j].x, cur_pt[j-1].y + d[j].y, cur_pt[j].x + d[j].x, cur_pt[j].y + d[j].y);
      }
    }

    map_buf.popStyle();
  }

  public void draw_area_in_buf(int i){
    PVector centor = new PVector(0, 0);
    map_buf.pushStyle();
    map_buf.noStroke();
    map_buf.beginShape();
    map_buf.fill(way[i].mainColor);
    for(int j=0; j<way[i].nd.length; j++){
      PVector cur = linear_map(way[i].coordinate[j].x, way[i].coordinate[j].y, geoBox, curBox); 
      map_buf.vertex(cur.x,cur.y);
      centor.add(cur);
    }
    map_buf.endShape();
    map_buf.popStyle();
  }

  public void draw_way(IntList t, int c){
    if(t == null)
      return;
    pushStyle();
    PVector cur;
    PVector next;
    cur = linear_map(node[t.get(0)].x, node[t.get(0)].y, geoBox, curBox);  
    stroke(c);
    strokeWeight(2);
    for(int i=1; i<t.size(); i++){
      next = linear_map(node[t.get(i)].x, node[t.get(i)].y, geoBox, curBox); 
      line(cur.x, cur.y, next.x, next.y);
      cur = next;
    }
    popStyle();
  }

  public void draw_way_name(int i){
    pushStyle();
    fill(0);
    int index = way[i].nd.length/2;
    PVector cur = linear_map(way[i].coordinate[index].x, way[i].coordinate[index].y, geoBox, curBox); 
    draw_text(way[i].name, cur.x, cur.y);
    popStyle();
  }

  public void draw_node_name(int i){
    if(i<0 || node[i].not_draw)
      return;
    pushStyle();
    PVector cur = linear_map(node[i].x, node[i].y, geoBox, curBox); 
    fill(0);
    if(node[i].name != null && draw_text(node[i].name, cur.x, cur.y)){
      fill(node[i].c);
      noStroke();
      ellipse(cur.x, cur.y, node[i].d, node[i].d);
    }
    popStyle();
  }

  public void draw_node(int i, int c, int d){
    if(i<0)
      return;
    pushStyle();
    fill(c);
    noStroke();
    PVector cur = linear_map(node[i].x, node[i].y, geoBox, curBox); 
    ellipse(cur.x, cur.y, d, d);
    popStyle();
  }
  
  public void draw_node(int i){
    if(i<0)
      return;
    pushStyle();
    fill(node[i].c);
    noStroke();
    PVector cur = linear_map(node[i].x, node[i].y, geoBox, curBox); 
    ellipse(cur.x, cur.y, node[i].d, node[i].d);
    popStyle();
  }
 

  public boolean draw_text(String t, float x, float y){
    // x = x - str_h; y = y - str_h;
    float delta = text_delta;
    float d = textWidth(t);
    float h = str_h;

    if(x > d && x < width - d && y - h > 0 && y < height - h && 
       text_layer.get(PApplet.parseInt(x),PApplet.parseInt(y)) != 0xff000001 && 
       text_layer.get(PApplet.parseInt(x + d),PApplet.parseInt(y)) != 0xff000001 && 
       text_layer.get(PApplet.parseInt(x),PApplet.parseInt(y - h)) != 0xff000001 &&
       text_layer.get(PApplet.parseInt(x + d),PApplet.parseInt(y - h)) != 0xff000001 ){
      text_layer.fill(0xff000001);
      text_layer.rect(x - delta , y - h - delta , d + delta*2, h + delta*2);
      text(t,x,y);
      return true;
    }
    return false;
  }

  public int find_node_in_way(PVector t){
    return index_tree.find(limBox,t.x,t.y);
  }

  // int find_node_in_way(PVector t){
  //   float dis = inf;
  //   int ret = -1;
  //   for(int i=0; i<way.length; i++){
  //     if(!way[i].is_way) continue;
  //     for(int j=0; j<way[i].coordinate.length; j++){
  //       float tmp;
  //       PVector cur = linear_map(way[i].coordinate[j].x, way[i].coordinate[j].y, geoBox, curBox); 
  //       tmp = (PVector.sub(cur,t)).mag();
  //       if(tmp < dis){
  //         dis = tmp;
  //         ret = way[i].index[j];
  //       }
  //     }
  //   }
  //   return ret;
  // }

  // IntList path(int s, int e){ // A* 
  //   float[] d = new float[node.length];
  //   int[] pre = new int[node.length];
  //   boolean[] open_l = new boolean[node.length];
  //   boolean[] closed_l = new boolean[node.length];

  //   for(int i=0; i<node.length; i++){
  //     d[i] = inf;
  //     pre[i] = i;
  //     open_l[i] = false;
  //     closed_l[i] = false;
  //   }

  //   d[s] = 0;

  //   HeapNode cur, tmp;
  //   Heap queue = new Heap(node.length);

  //   queue.push(s,d[s]);
  //   while(!queue.empty()){
  //     cur = queue.top(); queue.pop();
  //     open_l[cur.index] = false;
  //     closed_l[cur.index] = true;
  //     if(cur.index == e)
  //       break;
  //     if(cur.f == inf) continue;
  //     for(int i=star[cur.index]; i<star[cur.index+1]; i++){
  //       if(!closed_l[edge[i].v]){
  //         float new_d = d[edge[i].u] + edge[i].w;
  //         float dx = node[edge[i].v].coordinate.x-node[e].coordinate.x;
  //         float dy = node[edge[i].v].coordinate.y-node[e].coordinate.y;
  //         float f = new_d + abs(dx) + abs(dy);
  //         if(!open_l[edge[i].v]){
  //           open_l[edge[i].v] = true;
  //           d[edge[i].v] = new_d;
  //           pre[edge[i].v] = edge[i].u;
  //           queue.push(edge[i].v,f);
  //         }
  //         else if (d[edge[i].v] > new_d){
  //           d[edge[i].v] = new_d;
  //           pre[edge[i].v] = edge[i].u;
  //           queue.change(edge[i].v,f);
  //         }
  //       }
  //     }
  //   }
  //   println("A* dis :", d[e]);
  //   IntList ret = new IntList();
  //   int now = e;
  //   if(d[now] != inf){
  //     while(pre[now] != now){
  //       ret.append(now);
  //       now = pre[now];
  //     }
  //     ret.append(now);
  //   }
  //   return ret;
  // }

  public IntList pathDij(int s, int e){
    float[] d = new float[node.length];
    int[] pre = new int[node.length];
    boolean[] used = new boolean[node.length];

    for(int i=0; i<node.length; i++){
      d[i] = inf;
      pre[i] = i;
      used[i] = false;
    }

    d[s] = 0;

    HeapNode cur;
    Heap queue = new Heap(node.length);
    queue.push(s,d[s]);

    while(!queue.empty()){
      cur = queue.top(); queue.pop();
      used[cur.index] = true;
      if(cur.index == e)
        break;
      if(cur.f == inf) continue;
      for(int i=star[cur.index]; i<star[cur.index+1]; i++){
        if(d[edge[i].v] > d[edge[i].u] + edge[i].w){
          d[edge[i].v] = d[edge[i].u] + edge[i].w;
          pre[edge[i].v] = edge[i].u;
          // if(!queue.change(edge[i].v,d[edge[i].v]))
          queue.push(edge[i].v,d[edge[i].v]);
        }
      }
    }
    println("Dij dis :", d[e]);
    IntList ret = new IntList();
    int now = e;
    if(d[now] != inf){
      while(pre[now] != now){
        ret.append(now);
        now = pre[now];
      }
      ret.append(now);
    }
    return ret;
  }

  public void draw_map(String map_save_path, int map_width, int map_height){

    map_buf.beginDraw();
    map_buf.background(230);

    curBox = new Box(0,map_buf.width,0,map_buf.height);

    ///////draw way////////////
    for(int i=0; i<way.length; i++){
      if(way[i].is_area){
        draw_area_in_buf(i);
      }
      else{
        draw_way_in_buf(i);
      }
    }

    map_buf.endDraw();

    curBox = new Box(0,width,0,height);
    map_buf.save(map_save_path);
  }

  public void draw_map(){
    text_layer.beginDraw();
    text_layer.background(255,150);

    for(int i=0;i<way.length;i++){
      if(way[i].name != null){
        draw_way_name(i);
      }
    }

    for(int i=0;i<node.length;i++){
      draw_node_name(i);
    }

    text_layer.endDraw();

    // image(text_layer,0,0); 

    // for(int i=0; i<node.length; i++){
    //   draw_node(i);
    // }
  }
};
class Node implements Comparable {

  long id;
  float x,y;
  Tag[] tag;
  PVector coordinate = new PVector(); // x,y on screen
  boolean not_draw = true;
  String name;
  int c = 0;
  float d = 3;
  
  //Node Elements

  private void tag_clasify(){ // ref to http://wiki.openstreetmap.org/wiki/Map_Features
    for(int j=0; j<tag.length; j++){
      String t = tag[j].k;
      if(t.equals("name")){
        name = tag[j].v;
        not_draw = false;
      }
    }
  }

  Node(long id, XML node){
    this.id = id;
    if(node != null){
      x = node.getFloat("lon");
      y = node.getFloat("lat");
      XML[] tmp = node.getChildren("tag");
      if(tmp != null){
        tag = new Tag [tmp.length];
        for(int i=0; i<tmp.length; i++){
          tag[i] = new Tag(tmp[i].getString("k"),tmp[i].getString("v"));
        }
        tag_clasify();
      }// else (tag.length == 0) means tag is null
    }
  }
  //Node Construction

  public int compareTo(Object o){
    long p = ((Node)o).id;
    return (p == id)? 0 : (p < id ? 1 : -1);
  }
  //Node Compare
  //To search Arrays.binarySearch(this.node,new Node(3157273866L,(XML)null));
  
};
//Class Node


class Relation implements Comparable {

  class Member{
    int type;
    long ref;
    String role;

    Member(XML member){
      if(member != null){
        String tmp = member.getString("type");
        if(tmp.equals("node"))
          type = 1;
        else if(tmp.equals("way"))
          type = 2;
        else
          type = 3;
        ref = Long.parseLong(member.getString("ref"));
        role = member.getString("role");
      }
    }

    public void debug_print(){
      println("type:",type," | ref:",ref," | role:",role);
    }
  }
  //CLass Member

  long id;
  Member[] member;
  Tag[] tag;

  Relation(long id, XML relation){

    this.id = id;

    if(relation != null){
      XML[] tmp = relation.getChildren("member");
      if(tmp != null){
        member = new Member[tmp.length];
        for(int i=0; i<tmp.length; i++){
          member[i] = new Member(tmp[i]);
        }
      }

      tmp = relation.getChildren("tag");
      if(tmp != null){
        tag = new Tag [tmp.length];
        for(int i=0; i<tmp.length; i++){
          tag[i] = new Tag(tmp[i].getString("k"),tmp[i].getString("v"));
        }
      }
    }
  }

  public int compareTo(Object o){
    long p = ((Relation)o).id;
    return (p == id)? 0 : (p < id ? 1 : -1);
  }

};
//Class Relation
float[] LIM = {1,1,1,1,1,1};
float[] GAP = {0,0,0,0,0,0};
// float[] LIM = {0.5,2,4,8,10,14};
// float[] GAP = {0  ,2,2,2,2,2};
float ROAD_WIDTH = 3;

class Way implements Comparable {

  long id;
  long[] nd; //Node id list
  int[] index; //Node index
  Tag[] tag;
  String name = null;
  PVector[] coordinate;
  PVector[] d;
  boolean is_area = false;
  boolean is_way  = false;
  boolean one_way = false;
  float speed_limit = 30; // estimate speed to cal SP
  int mainColor = color(155);
  int sideColor = color(70);
  float mainWidth = ROAD_WIDTH;
  float sideWidth = 0;
  boolean is_dash = false;
  float dash_len = 5;
  float priority = 0;
  float zoom_limit = LIM[4];
  float fade_out = LIM[4] - GAP[4];

  //Way Element

  private void tag_clasify(){ // ref to http://wiki.openstreetmap.org/wiki/Map_Features

    float MID = mainWidth/2;
    float SMALL = mainWidth/3;

    if(nd[0] == nd[nd.length-1])
      is_area = true;

    for(int j=0; j<tag.length; j++){
        String t = tag[j].k;
        if(t.equals("aeroway")){
          t = tag[j].v;
          if(t.equals("runway")){
            is_area = false;
            mainColor = color(192,187,200);
            sideWidth = 0;
          }
          else if(t.equals("taxiway")){
            is_area = false;
            mainColor = color(192,187,200);
            mainWidth = MID;
            sideWidth = 0;
          }
          else if(t.equals("terminal")){
            is_area = true;
            mainColor = color(204,153,255);
            sideWidth = 0;
          }
          else{
            is_area = true;
            mainColor = color(233,209,255);
            sideWidth = 0;
          }
          return;
        }
        else if(t.equals("amenity")){
          is_area = true;
          mainColor = color(204,153,153);
          return;
        }
        else if(t.equals("barrier")){
          is_area = false;
          mainColor = color(200);
          mainWidth = 1;
          sideWidth = 0;
          return;
        }
        else if(t.equals("boundary")){
          t = tag[j].v;
          is_area = false;
          mainWidth = 1;
          sideWidth = 0;
          is_dash = true;
          if(t.equals("administrative")){
            mainColor = color(255,58,44);
          }
          else if(t.equals("national_park")){
            mainColor = color(0,250,70);
          }
          else{
            mainColor = color(100);
          }
          return;
        }
        else if(t.equals("building")){
          is_area = true;
          mainColor = color(155);
          return;
        }
        else if(t.equals("highway")){
          is_area = false;
          is_way  = true;
          t = tag[j].v;
          // if(t.equals("short-path")){
          //   mainColor = color(0);
          //   priority = 11;
          //   mainWidth = 2;
          //   // zoom_limit = LIM[1];
          //   // fade_out = zoom_limit - GAP[1];
          // }
          if(t.equals("motorway") || t.equals("trunk")){
            mainColor = color(243,162,59);
            sideColor = color(191,124,38);
            sideWidth = 1;
            priority = 10;
            zoom_limit = LIM[1];
            fade_out = zoom_limit - GAP[1];
          }
          else if(t.equals("motorway_link") || t.equals("trunk_link")){
            mainColor = color(243,162,59);
            sideColor = color(191,124,38);
            sideWidth = 1;
            mainWidth = MID;
            priority = 10;
            zoom_limit = LIM[1];
            fade_out = zoom_limit - GAP[1];
          }
          else if(t.equals("primary")){
            mainColor = color(255,195,69);
            sideColor = color(209,161,61);
            sideWidth = 1;
            priority = 9;
            zoom_limit = LIM[1];
            fade_out = zoom_limit - GAP[1];
          }
          else if(t.equals("primary_link")){
            mainColor = color(255,195,69);
            sideColor = color(209,161,61);
            sideWidth = 1;
            mainWidth = MID;
            priority = 9;
            zoom_limit = LIM[1];
            fade_out = zoom_limit - GAP[1];
          }
          else if(t.equals("secondary") ){
            mainColor = color(235,229,68);
            sideColor = color(207,201,62);
            priority = 7;
            zoom_limit = LIM[2];
            fade_out = zoom_limit - GAP[2];
          }
          else if(t.equals("secondary_link")){
            mainColor = color(235,229,68);
            sideColor = color(207,201,62);
            mainWidth = MID;
            priority = 7;
            zoom_limit = LIM[2];
            fade_out = zoom_limit - GAP[2];
          }
          else if(t.equals("tertiary")){
            mainColor = color(255,255,104);
            sideColor = color(222,222,89);
            mainWidth = MID;
            priority = 6;
            zoom_limit = LIM[3];
            fade_out = zoom_limit - GAP[3];
          }
          else if(t.equals("residential") || t.equals("unclassified")){
            mainColor = color(255,255,255);
            sideColor = color(200);
            mainWidth = MID;
            priority = 5;
            zoom_limit = LIM[4];
            fade_out = zoom_limit - GAP[4];
          }
          else if(t.equals("service")){
            mainColor = color(255,255,255);
            sideColor = color(200);
            mainWidth = SMALL;
            priority = 4;
            zoom_limit = LIM[4];
            fade_out = zoom_limit - GAP[4];
          }
          else if(t.equals("construction")){
            mainColor = color(127,162,199);
            sideColor = color(200);
            mainWidth = MID;
            is_dash = true;
            priority = 4;
            zoom_limit = LIM[4];
            fade_out = zoom_limit - GAP[4];
          }
          else if(t.equals("track")){
            mainColor = color(138,133,10);
            mainWidth = SMALL;
            is_dash = true;
            zoom_limit = LIM[3];
            fade_out = zoom_limit - GAP[3];
          }
          else if(t.equals("bus_guideway")){
            mainColor = color(9,26,156);
            mainWidth = SMALL;
            is_dash = true;
            zoom_limit = LIM[5];
            fade_out = zoom_limit - GAP[5];
          }
          else if(t.equals("raceway")){
            mainColor = color(156,9,9);
            mainWidth = SMALL;
            zoom_limit = LIM[5];
            fade_out = zoom_limit - GAP[5];
          }
          else if(t.equals("path")){
            mainColor = color(163);
            mainWidth = SMALL;
            sideWidth = 0;
            is_dash = true;
            zoom_limit = LIM[5];
            fade_out = zoom_limit - GAP[5];
          }
          else if(t.equals("footway") || t.equals("steps")){
            mainColor = color(255,255,104);
            mainWidth = SMALL;
            sideWidth = 0;
            is_dash = true;
            dash_len = 2;
            zoom_limit = LIM[5];
            fade_out = zoom_limit - GAP[5];
          }
          else if(t.equals("bridleway")){
            mainColor = color(0,49,196);
            mainWidth = SMALL;
            sideWidth = 0;
            is_dash = true;
            dash_len = 2;
            zoom_limit = LIM[5];
            fade_out = zoom_limit - GAP[5];
          }
          else if(t.equals("cycleway")){
            mainColor = color(0,222,159);
            mainWidth = SMALL;
            sideWidth = 0;
            is_dash = true;
            dash_len = 2;
            zoom_limit = LIM[5];
            fade_out = zoom_limit - GAP[5];
          }
          else if(t.equals("living_street") || t.equals("road") || t.equals("pedestrian")){
            mainColor = color(170);
            mainWidth = SMALL;
            zoom_limit = LIM[5];
            fade_out = zoom_limit - GAP[5];
          }
          else{
            mainColor = color(255);
            mainWidth = SMALL;
            zoom_limit = LIM[5];
            fade_out = zoom_limit - GAP[5];
          }
          return;
        }
        else if(t.equals("landuse")){
          is_area = true;
          t = tag[j].v;
          if(t.equals("allotments")){
            mainColor = color(239,198,160);
          }
          else if(t.equals("basin")){
            mainColor = color(174,210,205);
          }
          else if(t.equals("brownfield")){
            mainColor = color(186,181,137);
          }
          else if(t.equals("cemetery") || t.equals("forest") || t.equals("orchard") || t.equals("vineyard")){
            mainColor = color(155,202,164);
          }
          else if(t.equals("commercial")){
            mainColor = color(250,199,193);
          }
          else if(t.equals("construction")){
            mainColor = color(186,181,137);
          }
          else if(t.equals("farmland") || t.equals("farmyard")){
            mainColor = color(241,223,195);
          }
          else if(t.equals("garages")){
            mainColor = color(226,223,220);
          }
          else if(t.equals("grass") || t.equals("greenfield") ||  t.equals("meadow") || t.equals("village_green") ){
            mainColor = color(202,238,161);
          }
          else if(t.equals("military")){
            mainColor = color(255,169,159);
          }
          else{
            mainColor = color(222,208,213);
          }
          return;
        }
        else if(t.equals("leisure") || t.equals("tourism")){
          is_area = true;
          t = tag[j].v;
          if(t.equals("garden") || t.equals("golf_course")){
            mainColor = color(207,236,168);
          }
          else if(t.equals("pitch") || t.equals("sports_centre") || t.equals("stadium")){
            mainColor = color(0,209,149);
          }
          else{
            mainColor = color(120,235,196);
          }
          return;
        }
        else if(t.equals("natural")){
          is_area = true;
          t = tag[j].v;
          if(t.equals("wood") || t.equals("grassland") || t.equals("scrub")){
            mainColor = color(174,209,160);
          }
          else if(t.equals("heath") || t.equals("mud")){
            mainColor = color(230,220,209);
          }
          else if(t.equals("sand")){
            mainColor = color(255,255,121);
          }
          else if(t.equals("water") || t.equals("wetland")){
            mainColor = color(109,150,237);
          }
          else if(t.equals("beach")){
            mainColor = color(250,237,184);
          }
          else{
            mainColor = color(147,214,129);
          }
          return;
        }
        else if(t.equals("admin_level")){
          is_area = false;
          mainColor = color(150,150,150);
          priority = 12;
          mainWidth = 1;
          sideWidth = 0;
          is_dash = true;
          dash_len = 2;
          zoom_limit = LIM[3];
          fade_out   = LIM[2];
          return;
        }
        else if(t.equals("power")){
          t = tag[j].v;
          if(t.equals("line") || t.equals("minor_line")){
            is_area = false;
            mainColor = color(111);
            mainWidth = 1;
            zoom_limit = LIM[5];
            fade_out   = LIM[4];
          }
          else{
            is_area = true;
            mainColor = color(186);
          }
          return;
        }
        else if(t.equals("waterway")){
          mainColor = color(109,150,237);
          t = tag[j].v;
          if(t.equals("riverbank")){
            is_area = true;
          }
          else{
            is_area = false;
            mainWidth = SMALL;
            sideWidth = 0;
            zoom_limit = LIM[2];
            fade_out = LIM[1];
          }
          return;
        }
        else if(t.equals("route")){
          mainColor = color(200);
          mainWidth = SMALL;
          sideWidth = 0;
          is_dash = true;
          dash_len = 2;
          zoom_limit = LIM[5];
          fade_out   = LIM[4];
          return;
        }
        else if(t.equals("railway")){
          is_area = false;
          t = tag[j].v;
          if(t.equals("tram")){
            mainColor = color(100);
            mainWidth = SMALL;
            priority = 7;
            zoom_limit = LIM[4];
            fade_out   = LIM[3];
          }
          else if(t.equals("subway")){
            mainColor = color(128,154,155);
            mainWidth = SMALL;
            priority = 8;
            zoom_limit = LIM[3];
            fade_out   = LIM[2];
          }
          else{
            is_dash = true;
            mainWidth = SMALL;
            mainColor = color(100);
            sideWidth = 1;
            priority = 7;
            mainWidth = 3;
            sideWidth = 0.5f;
            is_dash = true;
            zoom_limit = LIM[4];
            fade_out   = LIM[3];
          }
          return;
        }
      }
  }

  // Way(IntList node_list){ // as SP
  //   index = new int[node_list.size()];
  //   for(int i=0; i<node_list.size(); i++){
  //     index[i] = node_list.get(i);
  //   }
  //   coordinate = new PVector[node_list.size()];
  //   tag = new Tag [1];
  //   tag[0] = new Tag("highway","short-path");
  // }

  public void get_name(){
    if(tag != null){
      for(int i=0;i<tag.length; i++){
        String t = tag[i].k;
        if(t.equals("name")){
          name = tag[i].v;
        }
        if(t.equals("oneway")){
          t = tag[i].v;
          if(t.equals("yes")){
            one_way = true;
          }
        }
      }
    }
  }

  Way(long id, XML way){

    this.id = id;

    if(way != null){
      XML[] tmp = way.getChildren("nd");
      if(tmp != null){
        nd = new long[tmp.length];
        index = new int[tmp.length];
        coordinate = new PVector[tmp.length];
        d = new PVector[tmp.length];
        for(int i=0; i<tmp.length; i++){
          nd[i] = Long.parseLong(tmp[i].getString("ref"));
        }
      }

      tmp = way.getChildren("tag");
      if(tmp != null){
        tag = new Tag [tmp.length];
        for(int i=0; i<tmp.length; i++){
          tag[i] = new Tag(tmp[i].getString("k"),tmp[i].getString("v"));
        }
        tag_clasify();
        get_name();
      }
    }
  }
  //Way Construct

  public int compareTo(Object o){
    float p = ((Way)o).priority;
    return (p == priority)? 0 : (p < priority ? 1 : -1);
  }
  //Way Compare

};
//Class Way
  static public void main(String[] passedArgs) {
    String[] appletArgs = new String[] { "map_project" };
    if (passedArgs != null) {
      PApplet.main(concat(appletArgs, passedArgs));
    } else {
      PApplet.main(appletArgs);
    }
  }
}
