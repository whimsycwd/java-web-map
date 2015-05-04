package com.whimsy.wmap;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.util.List;

import javax.imageio.ImageIO;

import com.whimsy.wmap.entity.RtnObj;
import com.whimsy.wmap.primitive.Bound;
import com.whimsy.wmap.primitive.RNode;
import com.whimsy.wmap.primitive.Way;

/**
 * Created by whimsy on 4/30/15.
 */
public class CreateImage {


    public static final int WIDTH = 1000;
    public static final int HEIGHT = 500;

    private RtnObj rtnObj;
    private Bound bound;


    public double calcX(double x) {
        return (x - bound.getMinLon()) / (bound.getMaxLon() - bound.getMinLon()) * WIDTH;
    }

    public double calcY(double y) {
        return (y - bound.getMinLat()) / (bound.getMaxLat() - bound.getMinLat()) * HEIGHT;
    }
    public void drawLine(Graphics2D g, int x1, int y1, int x2, int y2) {
        g.drawLine(x1, y1, x2, y2);
        System.out.printf("%d %d %d %d\n", x1, y1, x2, y2);
    }

    public void work() {

        rtnObj = new ReadFromOSM().work();
        bound = rtnObj.getBound();



        BufferedImage off_Image = new BufferedImage(WIDTH, HEIGHT, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2 = off_Image.createGraphics();

        g2.setPaint(Color.blue);

        for (Long wayId : rtnObj.getWayMap().keySet()) {
            Way way = rtnObj.getWayMap().get(wayId);

            List<RNode> path = way.getRNodes();

            if (path.size() <= 1) {
                continue;
            } else {
                for (int i = 1; i < path.size(); ++i) {
                    drawLine(g2, (int) calcX(path.get(i - 1).getLongtitude()),
                                (int) calcY(path.get(i - 1).getLatitude()), (int) calcX(path.get(i).getLongtitude()),
                                (int) calcY(path.get(i).getLatitude()));
                }
            }
        }




        File outputFile = new File("saved.png");


        try {
            ImageIO.write(off_Image, "png", outputFile);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static void main(String [] args) {
        new CreateImage().work();
    }
}
