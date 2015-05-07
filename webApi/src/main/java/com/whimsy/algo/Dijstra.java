package com.whimsy.algo;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.PriorityQueue;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.whimsy.process.entity.ContextObj;
import com.whimsy.process.primitivie.Way;

/**
 * Created by whimsy on 5/4/15.
 */
public class Dijstra {


    static final Logger logger = LoggerFactory.getLogger(Dijstra.class);

    public static ContextObj ctx = ContextObj.getInstance();




    public static Node [] nodes;
    static ArrayList<Edge> [] bags;
    public static Map<Long, Integer> id2Idx;





    @SuppressWarnings("unchecked")
    public Dijstra() {

        int size = ctx.getNodeMap().size();

        nodes = new Node[size + 1];

        bags = new ArrayList[size + 1];
        for (int i = 0; i < size + 1; ++i) {
            bags[i] = new ArrayList<Edge>();
        }


        int cnt = 0;
        for (Map.Entry<Long, com.whimsy.process.primitivie.Node> entry : ctx.getNodeMap().entrySet()) {
            nodes[cnt++] = new Node(entry.getKey(), entry.getValue());
        }


        // specal point to map all missing point.
        nodes[cnt++] = new Node(-1L, new com.whimsy.process.primitivie.Node(0, 0));


        Arrays.sort(nodes);

        id2Idx = new HashMap<Long, Integer>();

        for (int i = 0; i < nodes.length; ++i) {
            id2Idx.put(nodes[i].id, i);
        }




        int edgeCnt = 0;
        int missingNode = 0;

        for (Map.Entry<Long, Way> entry : ctx.getWayMap().entrySet()) {

            Way way = entry.getValue();

            if (!way.is_area) {

                for (int i = 1; i < way.getPathNodes().size(); ++i) {
                    Integer u = id2Idx.get(way.getPathNodes().get(i - 1));
                    Integer v = id2Idx.get(way.getPathNodes().get(i));



                    if (u == null) {
                        u = id2Idx.get(-1L);
                        ++missingNode;
                    }
                    if (v == null) {
                        v = id2Idx.get(-1L);
                        ++missingNode;
                    }

                    // hack, It shouldn't occur. Could way use node that not appear in node list?


                    double w = distance(u,v);

                    bags[u].add(new Edge(u, v, w));
                    bags[v].add(new Edge(v, u, w));
                    ++edgeCnt;
                }
            }
        }

        logger.info("Total generated Edge {}", edgeCnt);
        logger.info("Total missing Node {}", missingNode);



    }


    private double sqr(double x) {
        return x * x;
    }
    private double distance(int u, int v) {

        return Math.sqrt(sqr(nodes[u].x - nodes[v].x) + sqr(nodes[v].y - nodes[v].y));
    }


    public Node [] findPath(long s, long t) {
        int [] path = findPath0(id2Idx.get(s), id2Idx.get(t));
        Node [] pathNodes = new Node[path.length];

        for (int i = 0; i < path.length; ++i) {
            pathNodes[i] = nodes[path[i]];
        }

        return pathNodes;
    }

    private int [] findPath0(int s, int t) {

        PriorityQueue<HeapNode> pq = new PriorityQueue<HeapNode>();

        int n = nodes.length;
        int [] pre = new int[n];
        for (int i = 0; i < n; ++i) {
            pre[i] = i;
        }
        double [] d = new double[n];
        for (int i = 0; i < n; ++i) {
            d[i] = Long.MAX_VALUE;
        }



        // initialize source node

        d[s] = 0;
        pq.add(new HeapNode(s, d[s]));

        while (!pq.isEmpty()) {
            HeapNode cur = pq.poll();
            if (cur.idx == t) {
                break;
            }

            for (Edge edge : bags[cur.idx]) {
                if (d[edge.v] > d[cur.idx] + edge.w) {
                    d[edge.v]  = d[cur.idx] + edge.w;
                    pre[edge.v] = cur.idx;
                    pq.add(new HeapNode(edge.v, d[edge.v]));
                }
            }
        }

        logger.info("Dij distance : {}", d[t]);



        // calc Path;
        ArrayList<Integer> reversePath = new ArrayList<Integer>();
        int cur = t;
        if (d[cur] != Long.MAX_VALUE) {
            while (pre[cur] != cur) {
                reversePath.add(cur);
                cur = pre[cur];
            }
            reversePath.add(s);
        }

        Collections.reverse(reversePath);

        int [] retArr = new int[reversePath.size()];
        for (int i = 0; i < retArr.length; ++i) {
            retArr[i] = reversePath.get(i);
        }
        return retArr;
    }


    public static void main(String [] args) {
        Dijstra algo = new Dijstra();

    }


    class HeapNode implements Comparable<HeapNode> {
        int idx;
        double value;

        public HeapNode(int idx, double value) {
            this.idx = idx;
            this.value = value;
        }

        @Override
        public int compareTo(HeapNode o) {
            return value == o.value ? 0 : (value < o.value ? -1 : 1);
        }
    }


    public static class Node implements Comparable<Node>{
        public Long id;

        public double x;
        public double y;

        public Node(Long id, com.whimsy.process.primitivie.Node node) {
            this.id = id;
            x = node.getLon();
            y = node.getLat();
        }

        @Override
        public int compareTo(Node o) {
            if (this.id < o.id) {
                return -1;
            }
            if (this.id > o.id) {
                return 1;
            }
            return 0;
        }
    }

    class Edge {
        int u;
        int v;
        double w;

        public Edge(int u, int v, double w) {
            this.u = u;
            this.v = v;
            this.w = w;
        }
    }


}


