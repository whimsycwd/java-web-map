package com.whimsy.aux;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.PrintWriter;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Scanner;

/**
 * Created by whimsy on 5/15/15.
 */
public class ProcessTrajectory {


    public static String trajSuffix = ".path";
    public static String edgeSuffix = ".edge";
    public static String projectSuffix = ".project";

    /**
     * extract origrinal traj path
     * @param filename
     * @throws FileNotFoundException
     * @throws ParseException
     */
    void extractTrajectory(String filename) throws FileNotFoundException, ParseException {

        Scanner in = new Scanner(new File(filename));


        String outputFile = filename + trajSuffix;
        PrintWriter out = new PrintWriter(outputFile);

        for (int i = 0; i < 6; ++i) {
            in.nextLine();
        }

        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-M-dd hh:mm:ss");



        while (in.hasNext()) {
            String line = in.nextLine();
            String [] elments = line.split(",");


            Date date = sdf.parse(String.format("%s %s", elments[5], elments[6]));


//            System.out.println(date);

            out.println(elments[0] + " " + elments[1] + " " + date.getTime() / 1000);
        }


        out.close();
    }


    public void traverseFolder2(String path) throws FileNotFoundException, ParseException {

        File file = new File(path);
        if (file.exists()) {
            File[] files = file.listFiles();
            if (files.length == 0) {
                System.out.println("File is empty");
                return;
            } else {
                for (File file2 : files) {
                    if (file2.isDirectory()) {
                        System.out.println("Folder :" + file2.getAbsolutePath());
                        traverseFolder2(file2.getAbsolutePath());
                    } else {
                        System.out.println("File :" + file2.getAbsolutePath());

                        extractTrajectory(file2.getAbsolutePath());
                    }
                }
            }
        } else {
            System.out.println("File dosen't exist");
        }
    }

    public static void main(String [] args) throws FileNotFoundException, ParseException {
//        new ProcessTrajectory().work();

        new ProcessTrajectory().traverseFolder2("BeijingMap/Trajectory");
    }
}
