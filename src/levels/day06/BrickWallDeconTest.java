package levels.day06;

import java.util.function.Function;

import htmlMangle.BrickWallDeconstruction;
import mainZeroToHero.Days;

public class BrickWallDeconTest implements Function<Days.LevelName, String>{
  public String apply(Days.LevelName name) {
    BrickWallDeconstruction bw= new BrickWallDeconstruction(name)
      .addMovable(0, "Direction")
      .addReplaceable(0, "[]", "", "{}")
      .addImmovable(1, ": ")
      .newRow()
      .addReplaceable(0, ";", ":skull:", "Hello", "bye")
      .addMovable(1, "   ")
      .newRow()
      .addImmovable(2, "          ")
      .addToPile(0, true, "}")
      .addToPile(0, true, "{")
      .addToPile(0, true, ".turn: ")
      .addToPile(0, true, "Direction");
    return bw.build();
    }
  }