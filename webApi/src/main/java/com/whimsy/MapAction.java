package com.whimsy;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.common.collect.Lists;

import com.whimsy.map.algo.KdTree;
import com.whimsy.map.api.Edge;
import com.whimsy.map.api.Facade;
import com.whimsy.map.api.GeoPoint;
import com.whimsy.vo.NodeVO;
import com.whimsy.vo.PinPointVO;
import com.whimsy.vo.Point;
import com.whimsy.vo.RouteVO;

import edu.princeton.cs.algs4.Stopwatch;

/**
 * Created by whimsy on 4/29/15.
 */
@Path("map")
public class MapAction {

    static final Logger logger = LoggerFactory.getLogger(MapAction.class);


    static Facade facade = new Facade();

    static {
        InputStream nodeIS = MapAction.class.getClassLoader().getResourceAsStream(Config.NODE_FILE_GEN);
        InputStream edgeIS = MapAction.class.getClassLoader().getResourceAsStream(Config.EDGE_FILE_GEN);

        facade.buildGraph(nodeIS, edgeIS);
        facade.buildKdTree();
        facade.buildGridIndex(20);
        facade.buildMapMatching(20);
        facade.buildShortestPathAlgo();

        logger.info("Static Scope");
    }

    public MapAction() {
        logger.info("Create new Instance");

    }

    @Path("nearestEdges/{lat}/{lon}/{k}")
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response getNearestEdges(@PathParam("lat") double lat,
                                    @PathParam("lon") double lon,
                                    @PathParam("k") int k) {

        List<com.whimsy.map.api.Edge> res = facade.getNearEdges(lat, lon, k);
        return Response.ok(res).build();
    }

    @Path("mapmatching")
    @PUT
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response mapMatching(List<Point> points) {

        List<GeoPoint> trajectory = Lists.newArrayList();

        double deltaT = 0;

        for (Point point : points) {
            System.out.println(point.getLat() + " " + point.getLon());

            GeoPoint gp = new GeoPoint();
            gp.lat = point.getLat();
            gp.lon = point.getLon();
            gp.time = deltaT;
            deltaT += 50;

            trajectory.add(gp);
        }


        Stopwatch stopwatch = new Stopwatch();

        List<com.whimsy.map.api.Edge> edges = facade.hmmMatching(trajectory, 20);
        logger.info("Matching time consumes {} sec", stopwatch.elapsedTime());


        return Response.ok(edges).build();

    }



    @Path("/routing/{sId}/{tId}")
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response routing(@PathParam("sId") Integer sId,
                            @PathParam("tId") Integer tId
                            ) {

        logger.info("/routing/{sId}/{tId}  sId = {}, tid = {}", sId, tId);

        com.whimsy.map.api.Node[] path = facade.query(sId, tId);
        ArrayList<NodeVO> nodeVOs = new ArrayList<NodeVO>();
        for (int i = 0; i < path.length; ++i) {
            nodeVOs.add(new NodeVO(path[i].lon, path[i].lat));
        }

        return Response.ok(new RouteVO(nodeVOs)).build();

    }


    @Path("/nearest/{lat}/{lon}")
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response coordinate(@PathParam("lat") Double lat,
                               @PathParam("lon") Double lon) {
        logger.info("/nearest/{lon}/{lat}  X = {}, y = {}", lon, lat);

        KdTree.Point point = facade.nearest(lat, lon);
      return Response.ok(new PinPointVO(point.getId(), point.x(), point.y())).build();

    }



    @Path("/edge/{eId}")
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public ArrayList<NodeVO> edge(@PathParam("eId") Integer eId) {
        for (Edge edge : facade.graph.edges) {
            if (edge.id == eId) {


                ArrayList<NodeVO> nodeVOs = new ArrayList<NodeVO>();

                for (Edge.Figure node : edge.figures) {
                    nodeVOs.add(new NodeVO(node.lon, node.lat));
                }

                return nodeVOs;
            }
        }

        logger.info("Invalid edge Id");
        return null;
    }

    public static void main(String [] args) {
//        MapAction action = new MapAction();
//        action.coordinate(121.5758, 31.1869);

//        action.coordinate(39.9933848,116.3982942);
//        action.routing(14660, 26844);


    }


}
