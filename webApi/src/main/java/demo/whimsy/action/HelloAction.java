package demo.whimsy.action;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.core.Response;

import org.springframework.stereotype.Component;

/**
 * Created by whimsy on 4/29/15.
 */

@Component
@Path("/hello")
public class HelloAction {

    @GET
    public Response greet() {
        return Response.status(Response.Status.OK).entity("Hello World!").build();
    }
}
