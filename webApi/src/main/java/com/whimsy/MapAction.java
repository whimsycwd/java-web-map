package com.whimsy;

import java.util.ArrayList;
import java.util.Map;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import com.whimsy.algo.Dijstra;
import com.whimsy.algo.KdTree;
import com.whimsy.process.entity.ContextObj;
import com.whimsy.vo.NodeVO;
import com.whimsy.vo.PinPointVO;
import com.whimsy.vo.RouteVO;

/**
 * Created by whimsy on 4/29/15.
 */
@Path("map")
public class MapAction {

    public static Dijstra algo = new Dijstra();
    public static KdTree tree = new KdTree(ContextObj.getInstance());

//    @GET
//    @Produces(MediaType.APPLICATION_JSON)
//    public Response getAll() {
//
//        RtnObj rtnObj = new ReadFromOSM().work();
//
//        return Response.ok(rtnObj).build();
//    }

    @Path("/routing/{sId}/{tId}")
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response routing(@PathParam("sId") Long sId,
                            @PathParam("tId") Long tId
                            ) {

        System.out.printf("/routing  %d %d\n", sId, tId);

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
        System.out.printf("/api/nearest  requesting %.8f %.8f\n", coordinateX, coordinateY);

        KdTree.Point point = tree.nearest(new KdTree.Point(coordinateX, coordinateY));


        System.out.printf("Res Point : %.6f %.6f\n", point.x(), point.y());
        return Response.ok(new PinPointVO(point.getId(), point.x(), point.y())).build();
    }

    public static void main(String [] args) {
        MapAction action = new MapAction();
        action.coordinate(121.5758, 31.1869);
    }


}
