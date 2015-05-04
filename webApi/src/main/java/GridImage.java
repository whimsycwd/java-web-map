import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import javax.imageio.ImageIO;

public class GridImage implements Runnable {
    private BufferedImage image;
    private int rows, columns;
    private BufferedImage[][] smallImages;
    private int smallWidth;
    private int smallHeight;

    public GridImage(String filename, int rows, int columns) {
        this.rows = rows;
        this.columns = columns;
        try {
            image = ImageIO.read(new File(filename));
        } catch (IOException e) {
            e.printStackTrace();
        }
        this.smallWidth = image.getWidth() / columns;
        this.smallHeight = image.getHeight() / rows;
        smallImages = new BufferedImage[columns][rows];
    }

    public void run() {
        int count = 0;
        for (int y = 0; y < rows; y++) {
            for (int x = 0; x < columns; x++) {

                smallImages[x][y] = image.getSubimage(x * smallWidth, y
                                                                          * smallHeight, smallWidth, smallHeight);
                try {
                    ImageIO.write(smallImages[x][y], "jpg", new File("img-out/tile-"
                                                                         + (count++) + ".jpg"));
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    }

    public static void main(String[] args) {
        GridImage image = new GridImage("img/map.jpg",
                                           4, 4);
        image.run();
    }
}