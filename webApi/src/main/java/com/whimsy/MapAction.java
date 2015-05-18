package com.whimsy;

import java.util.ArrayList;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.glassfish.jersey.server.JSONP;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.whimsy.algo.Dijstra;
import com.whimsy.algo.KdTree;
import com.whimsy.entity.Edge;
import com.whimsy.entity.Graph;
import com.whimsy.entity.Node;
import com.whimsy.vo.NodeVO;
import com.whimsy.vo.PinPointVO;
import com.whimsy.vo.RouteVO;

/**
 * Created by whimsy on 4/29/15.
 */
@Path("map")
public class MapAction {

    static final Logger logger = LoggerFactory.getLogger(MapAction.class);

    static Graph graph = new Graph(Config.NODE_FILE_NEW, Config.EDGE_FILE_NEW);

    static KdTree tree = new KdTree(graph);

    static Dijstra dijstra = new Dijstra(graph);

//    public static Dijstra algo = new Dijstra();
//    public static KdTree tree = new KdTree(ContextObj.getInstance());
//
//    public static NameService nameService = new NameService(ContextObj.getInstance());

//    @Path("/findNodes/{queryStr}")
//    @GET
//    @Produces(MediaType.APPLICATION_JSON)
//    public ArrayList<NodeVO> findNodes(@PathParam("queryStr") String query) {
//
//        logger.info("/findNodes/{queryStr} {}", query);
//
////        ArrayList<Node> nodes = nameService.findNodes(query);
////
////        ArrayList<NodeVO> res = new ArrayList<NodeVO>();
////
////        for (Node node : nodes) {
////            res.add(new NodeVO(node.getLon(), node.getLat()));
////        }
//
////        return res;
//        return null;
//    }

//    @Path("/suggest")
//    @GET
//    @JSONP(queryParam = "callback")
//    @Produces({"application/javascript"})
//    public ArrayList<String> suggest(@QueryParam("callback") String callback,
//                                     @QueryParam("q") String query) {
//
//
//        logger.info("/suggest callback = {}  q ={}", callback, query);
//
////        return nameService.search(query);
//        return null;
//    }
//
    @Path("/routing/{sId}/{tId}")
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response routing(@PathParam("sId") Integer sId,
                            @PathParam("tId") Integer tId
                            ) {

        logger.info("/routing/{sId}/{tId}  sId = {}, tid = {}", sId, tId);

        Node[] path = dijstra.findPath(sId, tId);
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

        KdTree.Point point = tree.nearest(lat, lon);
      return Response.ok(new PinPointVO(point.getId(), point.x(), point.y())).build();

    }

    @Path("/edge/{eId}")
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public ArrayList<NodeVO> edge(@PathParam("eId") Integer eId) {
        for (Edge edge : graph.edges) {
            if (edge.id == eId) {


                ArrayList<NodeVO> nodeVOs = new ArrayList<NodeVO>();

                for (Edge.EdgeNode node : edge.eNodes) {
                    nodeVOs.add(new NodeVO(node.lon, node.lat));
                }

                return nodeVOs;
            }
        }

        logger.info("Invalid edge Id");
        return null;
    }

    public static void main(String [] args) {
        MapAction action = new MapAction();
//        action.coordinate(121.5758, 31.1869);

        action.coordinate(39.9933848,116.3982942);
        action.routing(14660, 26844);
    }


}
