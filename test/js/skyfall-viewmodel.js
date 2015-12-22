var LevelViewModel = function(layout, levelsConfig) {
  var self = this;

  self.query = ko.observable('');

  self.keySet = ko.computed(function() {
    return layout.query(self.query());
  });

  self.randomChar = function() {
    var r = Math.floor(Math.random() * self.keySet().length);
    return self.keySet()[r];
  };

  // Deep-copy the config into a new object.
  self.config = JSON.parse(JSON.stringify(levelsConfig));

  // Add group reviews, super group reviews, and a full review from the level queries.
  // Also add click handlers that set the query appropriately.
  (function(){
    var supergroup_reviews = [];
    $.each(self.config, function(_, supergroup) {
      if (supergroup.groups) {
        var group_reviews = [];
        $.each(supergroup.groups, function(_, group) {
          var level_queries = [];
          $.each(group.levels, function(_, level) {
            level.select = function(l) {
              self.query(l.query);
            };
            level_queries.push(level.query);
          });
          group.review = layout.simplifyQuery(level_queries);
          group.select = function(g) {
            self.query(g.review);
          };
          group_reviews.push(group.review);
        });
        supergroup.review = layout.simplifyQuery(group_reviews);
        supergroup.select = function(sg) {
          self.query(sg.review);
        };
        supergroup_reviews.push(supergroup.review);
      }
    });
    self.config.push({
      name: "all",
      title: "All Skills",
      review: layout.simplifyQuery(supergroup_reviews),
      select: function(sg) {
        self.query(sg.review);
      },
      groups: [],
    });
  })();
};
