habitrpg.controller('GroupApprovalsCtrl', ['$scope', 'Tasks',
  function ($scope, Tasks) {
    $scope.approvals = [];

    Tasks.getGroupApprovals($scope.group._id)
      .then(function (response) {
        $scope.approvals = response.data.data;console.log($scope.approvals)
      });

    $scope.approve = function (taskId, userId, $index) {
      if (!confirm("Are you sure you want to approve this?")) return;
      Tasks.approve(taskId, userId)
        .then(function (response) {
          $scope.approvals = $scope.approvals.splice(0, $index);
        });
    };

  }]);
