package com.whimsy.entity;

import java.io.File;
import java.io.FileNotFoundException;
import java.util.ArrayList;
import java.util.Scanner;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.whimsy.Config;

/**
 * Created by whimsy on 5/13/15.
 */
public class Graph {

    static Logger logger = LoggerFactory.getLogger(Graph.class);

    public Node [] nodes;

    public Edge [] edges;

    public ArrayList<Edge> [] bags;

    public Bound bound = new Bound();



    public Graph() {
        GraphInit("./BeijingMap/nodeOSM.txt", "./BeijingMap/edgeOSM.txt");
    }
    public Graph(String nodeFile, String edgeFile) {
        GraphInit(nodeFile, edgeFile);
    }


    @SuppressWarnings("unchecked")
    public void GraphInit(String nodeFile, String edgeFile) {


        Long startTime = System.currentTimeMillis();

        // read Nodes

        Scanner in = new Scanner(this.getClass().getClassLoader().getResourceAsStream(nodeFile));

        ArrayList<Node> nodes = new ArrayList<Node>();

        while (in.hasNext()) {
            Node node = new Node(in.nextInt(), in.nextDouble(), in.nextDouble());


            if (nodes.size() == 0) {
                bound.minLat = node.lat;
                bound.maxLat = node.lat;
                bound.minLon = node.lon;
                bound.maxLon = node.lon;

            } else {
                bound.minLat = Math.min(bound.minLat, node.lat);
                bound.maxLat = Math.max(bound.maxLat, node.lat);
                bound.minLon = Math.min(bound.minLon, node.lon);
                bound.maxLon = Math.max(bound.maxLon, node.lon);

            }
            nodes.add(node);
        }


        System.out.printf("Bound %.6f %.6f %.6f %.6f\n", bound.minLat, bound.maxLat, bound.minLon, bound.maxLon);

        this.nodes = new Node[nodes.size()];
        nodes.toArray(this.nodes);




        logger.info("Read Node in  {} ms",  System.currentTimeMillis() - startTime);


        startTime = System.currentTimeMillis();
        // read Edges

       in = new Scanner(this.getClass().getClassLoader().getResourceAsStream(edgeFile));

        ArrayList<Edge> edges = new ArrayList<Edge>();

        while (in.hasNext()) {
            Edge edge = new Edge();
            edge.id = in.nextInt();
            edge.sou = in.nextInt();
            edge.tar = in.nextInt();

            int cnt = in.nextInt();


            double weight = 0;

            for (int i = 0; i < cnt; ++i) {
                Edge.EdgeNode edgeNode = new Edge.EdgeNode();
                edgeNode.lat = in.nextDouble();
                edgeNode.lon = in.nextDouble();

                edge.eNodes.add(edgeNode);

                ArrayList<Edge.EdgeNode> eNodes = edge.eNodes;

                if (edge.eNodes.size() > 1) {
                    weight += distance(eNodes.get(eNodes.size() - 2), eNodes.get(eNodes.size() - 1));
                }
            }

            edge.weight = weight;

            edges.add(edge);


        }


        this.edges = new Edge[edges.size()];
        edges.toArray(this.edges);




        logger.info("Read Edge in  {} ms",  System.currentTimeMillis() - startTime);

        // construct Bags


        startTime = System.currentTimeMillis();


        bags = (ArrayList<Edge>[]) new ArrayList[this.nodes.length];
         for (int i = 0; i < this.nodes.length; ++i) {
             bags[i] = new ArrayList<Edge>();
         }


        for (Edge edge : edges) {
            bags[edge.sou].add(edge); // 单向边
        }

        logger.info("Read Bags in {} ms", System.currentTimeMillis() - startTime);

    }



    public static double distance(Edge.EdgeNode n1, Edge.EdgeNode n2) {
        return Math.sqrt((n1.lon - n2.lon) * (n1.lon - n2.lon) + (n1.lat - n2.lat) * (n1.lat - n2.lat));
    }


    public static void main(String [] args) {
        new Graph(Config.NODE_FILE_NEW, Config.EDGE_FILE_NEW);
    }
}
