package com.whimsy.algo;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.PriorityQueue;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.whimsy.Config;
import com.whimsy.entity.Edge;
import com.whimsy.entity.Graph;
import com.whimsy.entity.Node;

/**
 * Created by whimsy on 5/4/15.
 */
public class Dijstra {


    static final Logger logger = LoggerFactory.getLogger(Dijstra.class);

    ArrayList<Edge>[] bags;

    Node[] nodes;

    public Dijstra(Graph graph) {
        bags = graph.bags;
        nodes = graph.nodes;
    }




    public Node [] findPath(int s, int t) {


        return findPath0(s, t);
    }

    private Node [] findPath0(int s, int t) {

        PriorityQueue<HeapNode> pq = new PriorityQueue<HeapNode>();

        int n = bags.length;

        Edge [] preE = new Edge[n];

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
                if (d[edge.tar] > d[cur.idx] + edge.weight) {
                    d[edge.tar]  = d[cur.idx] + edge.weight;
                    preE[edge.tar] = edge;
                    pq.add(new HeapNode(edge.tar, d[edge.tar]));
                }
            }
        }

        logger.info("Dij distance : {}", d[t]);



        // calc Path;
        ArrayList<Edge> reverseEdge = new ArrayList<Edge>();

        int cur = t;
        if (d[cur] != Long.MAX_VALUE) {
            while (preE[cur] != null) {
                reverseEdge.add(preE[cur]);
                cur = preE[cur].sou;
            }
        }

        Collections.reverse(reverseEdge);

        ArrayList<Node> retArr = new ArrayList<Node>();

        for (Edge edge : reverseEdge) {
            for (Edge.EdgeNode edgeNode : edge.eNodes) {

                retArr.add(new Node(edgeNode.lat, edgeNode.lon));
            }
        }

        Node [] res = new Node[retArr.size()];

        retArr.toArray(res);

        return res;
    }


    public static void main(String [] args) {
        Dijstra algo = new Dijstra(new Graph(Config.NODE_FILE_NEW, Config.EDGE_FILE_NEW, false));

        System.out.println(algo.findPath(28064, 28063));

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





}


