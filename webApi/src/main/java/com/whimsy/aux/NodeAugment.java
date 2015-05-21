package com.whimsy.aux;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.whimsy.entity.Edge;
import com.whimsy.entity.Edge.EdgeNode;
import com.whimsy.entity.Graph;
import com.whimsy.entity.Node;

/**
 * Created by whimsy on 5/14/15.
 *
 * Becuase the edge can be intersect in a unidentified node, so
 * we need to augment the node set to make the graph connect.
 */
public class NodeAugment {

    static final Logger logger = LoggerFactory.getLogger(NodeAugment.class);

    private String nodeFile = "./BeijingMap/nodeOSM.txt";
    private String edgeFile = "./BeijingMap/edgeOSM.txt";
    private String augNodeFile = "./BeijingMap/augNodeOSM.txt";
    private String augEdgeFile = "./BeijingMap/augEdgeOSM.txt";

    final static double EPS = 1e-8;

    Node [] nodes;
    Edge [] edges;




    public NodeAugment() {
        Graph graph = new Graph(nodeFile, edgeFile, false);

        nodes = graph.nodes;
        edges = graph.edges;

        int idCnt = 0;

        long startTime = System.currentTimeMillis();

        Map<DiffNode, Integer> nodeDict = new TreeMap<DiffNode, Integer>();
        ArrayList<DiffNode> augNodes = new ArrayList<DiffNode>();

        int coincodeCnt = 0;
        for (Node node : nodes) {
            DiffNode diffNode = new DiffNode(node.lon, node.lat);

            if (nodeDict.get(diffNode) != null) {

//                throw new RuntimeException("Shouldn't be thrown, Please check precision factor EPS");
                logger.warn("Node coincide in origin file but with different Id");
                ++coincodeCnt;
            } else {
                nodeDict.put(diffNode, idCnt++);
            }
        }
        logger.warn("{} node coincide", coincodeCnt);
        logger.info("Origin node set {} nodes have {} distinct node", nodes.length, idCnt);

        for (Edge edge : edges) {

            List<EdgeNode> eNodes = edge.eNodes;

            // exclude start point and end point
            for (int i = 1; i < eNodes.size() - 1; ++i) {
                DiffNode diffNode = new DiffNode(eNodes.get(i).lon, eNodes.get(i).lat);

                if (nodeDict.get(diffNode) == null) {
                    nodeDict.put(diffNode, idCnt++);
                }
            }
        }


        // generate new Node set

        logger.info("Augment node set from {} to {}", nodes.length, idCnt);

        Node [] resNodes = new Node[idCnt];

        for (Map.Entry<DiffNode, Integer> entry : nodeDict.entrySet()) {
            resNodes[entry.getValue()] = new Node(entry.getValue(), entry.getKey().lat, entry.getKey().lon);
        }

        try {
            PrintWriter out = new PrintWriter(augNodeFile);


            for (int i = 0; i < idCnt; ++i) {
                out.printf("%d   %.7f    %.7f\n", resNodes[i].id, resNodes[i].lat, resNodes[i].lon);
            }

            out.close();;

        } catch (FileNotFoundException e) {
            e.printStackTrace();
        }


        logger.info("Augment node used {} ms", System.currentTimeMillis() - startTime);

        List<Edge> resEdges = new ArrayList<Edge>();

        startTime = System.currentTimeMillis();

        int edgeIdCnt = 0;

        for (Edge edge : edges) {

            List<EdgeNode> eNodes = edge.eNodes;

            for (int i = 0; i < eNodes.size() - 1; ++i) {
                Edge genEdge = new Edge();

                genEdge.id = edgeIdCnt++;

                genEdge.sou = nodeDict.get(new DiffNode(eNodes.get(i).lon, eNodes.get(i).lat));
                genEdge.tar = nodeDict.get(new DiffNode(eNodes.get(i + 1).lon, eNodes.get(i + 1).lat));

                genEdge.weight = Graph.distance(eNodes.get(i), eNodes.get(i + 1));

                genEdge.eNodes.add(eNodes.get(i));
                genEdge.eNodes.add(eNodes.get(i + 1));

                resEdges.add(genEdge);
            }
        }

        logger.info("Augment edge set from {} to {}", edges.length, edgeIdCnt);

        logger.info("Generate Edge Set used {} ms", System.currentTimeMillis() - startTime);

        try {
            PrintWriter out = new PrintWriter(augEdgeFile);

            for (Edge edge : resEdges) {
                out.printf("%d  %d  %d  %d", edge.id, edge.sou, edge.tar, edge.eNodes.size());

                for (int i = 0; i < edge.eNodes.size(); ++i) {
                    EdgeNode edgeNode = edge.eNodes.get(i);
                    out.printf("    %.7f    %.7f", edgeNode.lat, edgeNode.lon);
                }
                out.println();
            }
            out.close();
        } catch (FileNotFoundException e) {
            e.printStackTrace();
        }

    }

    public static void main(String [] args) {
        new NodeAugment();
    }


    static class DiffNode implements  Comparable<DiffNode> {

        double lon;
        double lat;

        public DiffNode(double lon, double lat) {
            this.lon = lon;
            this.lat = lat;
        }

        @Override
        public int compareTo(DiffNode o) {
            if (Math.abs(lon - o.lon) < EPS) {
                if  (Math.abs(lat - o.lat) < EPS) {
                    return 0;
                } else {
                    return lat < o.lat ? -1 : 1;
                }
            } else {
                return lon < o.lon ? -1 : 1;
            }
        }
    }
}
