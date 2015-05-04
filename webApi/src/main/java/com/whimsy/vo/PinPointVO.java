package com.whimsy.vo;

/**
 * Created by whimsy on 5/4/15.
 */
public class PinPointVO {
    private Long id;
    private Long idx;

    private double x;
    private double y;

    public PinPointVO(Long id, Long idx, double x, double y) {
        this.id = id;
        this.idx = idx;
        this.x = x;
        this.y = y;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getIdx() {
        return idx;
    }

    public void setIdx(Long idx) {
        this.idx = idx;
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
