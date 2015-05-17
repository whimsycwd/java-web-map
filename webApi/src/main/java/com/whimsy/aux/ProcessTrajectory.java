package com.whimsy.aux;

import java.io.FileNotFoundException;
import java.io.PrintWriter;
import java.util.Scanner;

/**
 * Created by whimsy on 5/15/15.
 */
public class ProcessTrajectory {



    void work() throws FileNotFoundException {

//        String filename = "./BeijingMap/Trajectory/Source/20081023025304.plt";
        String filename = "./BeijingMap/Trajectory/Source/20081024020959.plt";
        Scanner in = new Scanner(this.getClass().getClassLoader().getResourceAsStream(filename));


//        String outputFile = "./BeijingMap/Trajectory/20081023025304.path";
        String outputFile = "./BeijingMap/Trajectory/20081024020959.path";
        PrintWriter out = new PrintWriter(outputFile);

        for (int i = 0; i < 6; ++i) {
            in.nextLine();
        }

        while (in.hasNext()) {
            String line = in.nextLine();
            String [] elments = line.split(",");
            out.println(elments[0] + " " + elments[1]);
        }

        out.close();
    }

    public static void main(String [] args) throws FileNotFoundException {
        new ProcessTrajectory().work();
    }
}
