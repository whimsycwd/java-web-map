package com.whimsy.vo;

/**
 * Created by whimsy on 5/4/15.
 */
public class PinPointVO {
    private Integer id;

    private double x;
    private double y;

    public PinPointVO(Integer id, double x, double y) {
        this.id = id;
        this.x = x;
        this.y = y;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }
    public double getX() {
        return x;
    }

    public void setX(double x) {
        this.x = x;
    }

    public double getY() {
        return y;
    }

    public void setY(double y) {
        this.y = y;
    }
}
