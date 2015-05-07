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
import com.whimsy.process.entity.ContextObj;
import com.whimsy.process.primitivie.Node;
import com.whimsy.vo.NodeVO;
import com.whimsy.vo.PinPointVO;
import com.whimsy.vo.RouteVO;

/**
 * Created by whimsy on 4/29/15.
 */
@Path("map")
public class MapAction {

    static final Logger logger = LoggerFactory.getLogger(MapAction.class);

    public static Dijstra algo = new Dijstra();
    public static KdTree tree = new KdTree(ContextObj.getInstance());

    public static NameService nameService = new NameService(ContextObj.getInstance());

    @Path("/findNodes/{queryStr}")
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public ArrayList<NodeVO> findNodes(@PathParam("queryStr") String query) {

        logger.info("/findNodes/{queryStr} {}", query);

        ArrayList<Node> nodes = nameService.findNodes(query);

        ArrayList<NodeVO> res = new ArrayList<NodeVO>();

        for (Node node : nodes) {
            res.add(new NodeVO(node.getLon(), node.getLat()));
        }

        return res;
    }

    @Path("/suggest")
    @GET
    @JSONP(queryParam = "callback")
    @Produces({"application/javascript"})
    public ArrayList<String> suggest(@QueryParam("callback") String callback,
                                     @QueryParam("q") String query) {


        logger.info("/suggest callback = {}  q ={}", callback, query);

        return nameService.search(query);
    }

    @Path("/routing/{sId}/{tId}")
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response routing(@PathParam("sId") Long sId,
                            @PathParam("tId") Long tId
                            ) {

        logger.info("/routing/{sId}/{tId}  sId = {}, tid = {}", sId, tId);

        Dijstra.Node[] path = algo.findPath(sId, tId);
        ArrayList<NodeVO> nodeVOs = new ArrayList<NodeVO>();
        for (int i = 0; i < path.length; ++i) {
            nodeVOs.add(new NodeVO(path[i].x, path[i].y));
        }

        return Response.ok(new RouteVO(nodeVOs)).build();

    }


    @Path("/nearest/{coordinateX}/{coordinateY}")
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response coordinate(@PathParam("coordinateX") Double coordinateX,
                               @PathParam("coordinateY") Double coordinateY) {
        logger.info("/nearest/{coordinateX}/{coordinateY}  X = {}, y = {}", coordinateX, coordinateY);

        KdTree.Point point = tree.nearest(new KdTree.Point(coordinateX, coordinateY));
      return Response.ok(new PinPointVO(point.getId(), point.x(), point.y())).build();
    }

    public static void main(String [] args) {
        MapAction action = new MapAction();
//        action.coordinate(121.5758, 31.1869);
    }


}
