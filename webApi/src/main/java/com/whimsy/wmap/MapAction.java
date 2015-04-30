package com.whimsy.wmap;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import com.whimsy.wmap.entity.RtnObj;
import com.whimsy.wmap.primitive.Context;

/**
 * Created by whimsy on 4/29/15.
 */


@Path("map")
public class MapAction {

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAll() {

        RtnObj rtnObj = new ReadFromOSM().work();

        return Response.ok(rtnObj).build();
    }

}
