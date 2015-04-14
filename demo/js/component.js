
var resizeableImage = function(image_target) {
  // Some variable and settings
  var $container,
      $overlay,
      orig_src = new Image(),
      image_target = $(image_target).get(0),// nojquery
      event_state = {},
      constrain = false,
      min_width = 200, // Change as required
      min_height = 200,
      max_width = 800, // Change as required
      max_height = 900,
      resize_canvas = document.createElement('canvas');



  init = function(){

    // When resizing, we will always use this copy of the original as the base
    orig_src.src=image_target.src;

    // Wrap the image with the container and add resize handles
    $(image_target).wrap('<div class="resize-container"></div>')// nojquery
    /*.before('<span class="resize-handle resize-handle-nw"></span>')
    .before('<span class="resize-handle resize-handle-ne"></span>')
    .after('<span class="resize-handle resize-handle-se"></span>')
    .after('<span class="resize-handle resize-handle-sw"></span>');*/

    // Assign the container to a variable
    $container =  $(image_target).parent('.resize-container');// nojquery
    
    // Add events
    $container.on('mousedown touchstart', '.resize-handle', startResize);// nojquery
    $container.on('mousedown touchstart', 'img', startMoving);// nojquery
    $('.js-crop').on('click', crop);// nojquery
    $overlay = $("#overlay");

    document.getElementById("zoom").addEventListener("change",zoom);
  };

  startResize = function(e){
    e.preventDefault();
    e.stopPropagation();
    saveEventState(e);
    //$(document).on('mousemove touchmove', resizing); // nojquery
    $(document).on('mouseup touchend', endResize); // nojquery
  };

  endResize = function(e){
    e.preventDefault();
    $(document).off('mouseup touchend', endResize); // nojquery
    $(document).off('mousemove touchmove', resizing); // nojquery
  };

  saveEventState = function(e){
    // Save the initial event details and container state
    event_state.container_width = $container.width();
    event_state.container_height = $container.height();
    event_state.container_left = $container.offset().left; 
    event_state.container_top = $container.offset().top;
    event_state.mouse_x = (e.clientX || e.pageX || e.originalEvent.touches[0].clientX) + $(window).scrollLeft(); 
    event_state.mouse_y = (e.clientY || e.pageY || e.originalEvent.touches[0].clientY) + $(window).scrollTop();
	
	// This is a fix for mobile safari
	// For some reason it does not allow a direct copy of the touches property
	if(typeof e.originalEvent.touches !== 'undefined'){
		event_state.touches = [];
		$.each(e.originalEvent.touches, function(i, ob){ // nojquery
		  event_state.touches[i] = {};
		  event_state.touches[i].clientX = 0+ob.clientX;
		  event_state.touches[i].clientY = 0+ob.clientY;
		});
	}
    event_state.evnt = e;
  };

  resizing = function(e){
    var mouse={},width,height,left,top,offset=$container.offset();
    mouse.x = (e.clientX || e.pageX || e.originalEvent.touches[0].clientX) + $(window).scrollLeft(); 
    mouse.y = (e.clientY || e.pageY || e.originalEvent.touches[0].clientY) + $(window).scrollTop();
    
    // Position image differently depending on the corner dragged and constraints
    if( $(event_state.evnt.target).hasClass('resize-handle-se') ){// nojquery
      width = mouse.x - event_state.container_left;
      height = mouse.y  - event_state.container_top;
      left = event_state.container_left;
      top = event_state.container_top;
    } else if($(event_state.evnt.target).hasClass('resize-handle-sw') ){// nojquery
      width = event_state.container_width - (mouse.x - event_state.container_left);
      height = mouse.y  - event_state.container_top;
      left = mouse.x;
      top = event_state.container_top;
    } else if($(event_state.evnt.target).hasClass('resize-handle-nw') ){// nojquery
      width = event_state.container_width - (mouse.x - event_state.container_left);
      height = event_state.container_height - (mouse.y - event_state.container_top);
      left = mouse.x;
      top = mouse.y;
      if(constrain || e.shiftKey){
        top = mouse.y - ((width / orig_src.width * orig_src.height) - height);
      }
    } else if($(event_state.evnt.target).hasClass('resize-handle-ne') ){// nojquery
      width = mouse.x - event_state.container_left;
      height = event_state.container_height - (mouse.y - event_state.container_top);
      left = event_state.container_left;
      top = mouse.y;
      if(constrain || e.shiftKey){
        top = mouse.y - ((width / orig_src.width * orig_src.height) - height);
      }
    }
	
    // Optionally maintain aspect ratio
    if(constrain || e.shiftKey){
      height = width / orig_src.width * orig_src.height;
    }

    if(width > min_width && height > min_height && width < max_width && height < max_height){
      // To improve performance you might limit how often resizeImage() is called
      resizeImage(width, height);  
      // Without this Firefox will not re-calculate the the image dimensions until drag end
      $container.offset({'left': left, 'top': top});// nojquery
    }
  }

  resizeImage = function(width, height){
    resize_canvas.width = width;
    resize_canvas.height = height;
    resize_canvas.getContext('2d').drawImage(orig_src, 0, 0, width, height);   
    $(image_target).attr('src', resize_canvas.toDataURL("image/png")); // nojquery 
  };

    startMoving = function(e){
        e.preventDefault();
        e.stopPropagation();
        saveEventState(e);
        $(document).on('mousemove touchmove', moving);// nojquery
        $(document).on('mouseup touchend', endMoving);// nojquery
    };

  endMoving = function(e){
    e.preventDefault();
    $(document).off('mouseup touchend', endMoving);// nojquery
    $(document).off('mousemove touchmove', moving);// nojquery
  };

  moving = function(e){
    var  mouse={}, touches;
    e.preventDefault();
    e.stopPropagation();

    touches = e.originalEvent.touches;

    mouse.x = (e.clientX || e.pageX || touches[0].clientX) + $(window).scrollLeft(); 
    mouse.y = (e.clientY || e.pageY || touches[0].clientY) + $(window).scrollTop(); //touches[0] may be undefined

    var offset = {};
    var img = {};

    img.width = $("#overlay img").width();
    img.height = $("#overlay img").height();

    offset.left = mouse.x - ( event_state.mouse_x - event_state.container_left );
    offset.top = mouse.y - ( event_state.mouse_y - event_state.container_top );

    //top left corner
    if(offset.left > $overlay.offset().left) {
        console.error("white space left")
        offset.left = $container.offset().left;
    }

    if(offset.top > $overlay.offset().top) {
        console.error("white space top")
        offset.top = $container.offset().top;
    }

    //bottom right corner
    if(offset.left +  img.width - 3 <= $overlay.offset().left + $overlay.innerWidth()) {
        console.error("*** white space right")
        offset.left = $container.offset().left;
    }

    if(offset.top +  img.height - 3 <= $overlay.offset().top + $overlay.innerHeight()) {
        console.error("*** white space right")
        offset.top = $container.offset().top;
    }

    $container.offset({
        'left': offset.left,
        'top':  offset.top 
    });        

    // Watch for pinch zoom gesture while moving
    /*if(event_state.touches && event_state.touches.length > 1 && touches.length > 1){
      var width = event_state.container_width, height = event_state.container_height;
      var a = event_state.touches[0].clientX - event_state.touches[1].clientX;
      a = a * a; 
      var b = event_state.touches[0].clientY - event_state.touches[1].clientY;
      b = b * b; 
      var dist1 = Math.sqrt( a + b );
      
      a = e.originalEvent.touches[0].clientX - touches[1].clientX;
      a = a * a; 
      b = e.originalEvent.touches[0].clientY - touches[1].clientY;
      b = b * b; 
      var dist2 = Math.sqrt( a + b );

      var ratio = dist2 /dist1;

      width = width * ratio;
      height = height * ratio;
      // To improve performance you might limit how often resizeImage() is called
      resizeImage(width, height);
    }*/
  };
    var waitingZoom = false;
    zoom = function() {
        if(waitingZoom) return;
        waitingZoom = true;
        setTimeout(function() {
            var z = document.getElementById("zoom").value;
            var width = event_state.container_width, height = event_state.container_height;
            console.log(z,width, height); 
            ratio = z
            width = width * ratio;
            height = height * ratio;

            resizeImage(width, height);
            waitingZoom = false;
        },125);
    };

  crop = function(){
    //Find the part of the image that is inside the crop box
    var crop_canvas,
        left = $('.overlay').offset().left - $container.offset().left,// nojquery
        top =  $('.overlay').offset().top - $container.offset().top,// nojquery
        width = $('.overlay').width(),// nojquery
        height = $('.overlay').height();// nojquery
		
    crop_canvas = document.createElement('canvas');
    crop_canvas.width = width;
    crop_canvas.height = height;
    
    crop_canvas.getContext('2d').drawImage(image_target, left, top, width, height, 0, 0, width, height);
    window.open(crop_canvas.toDataURL("image/png"));
  }

  init();
};

// Kick everything off with the target image
resizeableImage($('.resize-image'));// nojquery