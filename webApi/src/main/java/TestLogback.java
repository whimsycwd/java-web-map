import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Created by whimsy on 5/7/15.
 */
public class TestLogback {
    static final Logger logger = LoggerFactory.getLogger(TestLogback.class);

    public static void main(String [] args) {
        logger.trace("Hello World!");
        logger.debug("How are you today?");
        logger.info("I am fine.");
        logger.warn("I love programming.");
        logger.error("I am programming.");

        logger.debug("%s %s shit {} {}", "abc", "def");
    }

}
