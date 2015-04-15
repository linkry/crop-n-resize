
var resizeableImage = function(options) {
  // Some variable and settings
    var $container,
        $overlay = document.querySelector(".component"),
        $input = document.querySelector('#cnr-input'),
        img = {},
        orig_src = new Image(),
        image_target = null,
        event_state = {},
        min_width = options.width, // Change as required
        min_height = options.height,
        resize_canvas = document.createElement('canvas');
    $overlay.style.width = options.width+"px";
    $overlay.style.height = options.height+"px";

    init = function(imgURI){

        image_target = document.createElement("img");
        image_target.onload = function() {
            img.originalWidth = this.width;
            img.originalHeight = this.height;
            console.log("image dimensions",this.width, this.height);
            resizeInitImage(min_width,min_height, this.width, this.height);
        };
        image_target.setAttribute("src",imgURI);

        image_target.setAttribute("class","resize-image");

        $container = document.createElement("div");
        $container.setAttribute("class","resize-container");

        $overlay.appendChild($container);
        $container.appendChild(image_target);
        //give it data uri from filereader

        //



        // When resizing, we will always use this copy of the original as the base
        orig_src.src=image_target.src;

        // Wrap the image with the container and add resize handles
        //$(image_target).wrap('<div class="resize-container"></div>')// nojquery
        /*.before('<span class="resize-handle resize-handle-nw"></span>')
        .before('<span class="resize-handle resize-handle-ne"></span>')
        .after('<span class="resize-handle resize-handle-se"></span>')
        .after('<span class="resize-handle resize-handle-sw"></span>');*/

        // Assign the container to a variable
        //$container =  $(image_target).parent('.resize-container');// nojquery

        // Add events
        $($container).on('mousedown touchstart', 'img', startMoving);// nojquery
        $('.js-crop').on('click', crop);// nojquery
        img.zoom = 0;
        img.width = $(image_target).width();
        img.height = $(image_target).height();
        img.boundaries = {};
        img.boundaries.max = $($overlay).offset();
        img.boundaries.min = {
            left : Math.round($($overlay).offset().left - (img.width - $($overlay).width())), 
            top : Math.round($($overlay).offset().top - (img.height - $($overlay).height()))
        };
        document.getElementById("zoom").value = 0;
        img.ratio = 0;
        document.getElementById("zoom").addEventListener("change",zoom);
        
    };

    saveEventState = function(e) {
        // Save the initial event details and container state
        event_state.container_width = $($container).width();
        event_state.container_height = $($container).height();
        event_state.container_left = $($container).offset().left; 
        event_state.container_top = $($container).offset().top;
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

    resizeImage = function(oldRatio, newRatio){
        oldRatio = parseFloat(oldRatio);
        newRatio = parseFloat(newRatio);
        resize_canvas.width = img.width;
        resize_canvas.height = img.height;

        offset = $($container).offset();

        var xleft, xtop, oldWidth, oldHeight, newWidth;
        newWidth = img.width;
        newHeight = img.height;
        oldWidth = newWidth - img.originalWidth*(Math.abs(newRatio - oldRatio));
        oldHeight = newHeight - img.originalHeight*(Math.abs(newRatio - oldRatio));
        console.log("oldWidth", oldWidth, "newWidth", newWidth);

        if(oldRatio > newRatio) { //zooming out
            console.info("zooming out");
            xleft = Math.floor(offset.left +(Math.abs(newWidth - oldWidth)/2)); 
            xtop = Math.floor(offset.top +(Math.abs(newHeight - oldHeight)/2)); 
        } else {//zooming in
            console.info("zooming in");
            xleft = Math.floor(offset.left -(Math.abs(newWidth - oldWidth)/2)); 
            xtop = Math.floor(offset.top -(Math.abs(newHeight - oldHeight)/2)); 
      
        }

        
        img.boundaries.min = {
            left : Math.round($($overlay).offset().left - (img.width - $($overlay).width())), 
            top : Math.round($($overlay).offset().top - (img.height - $($overlay).height()))
        };


        if(xleft > img.boundaries.max.left) {
            xleft = img.boundaries.max.left;
        }

        //top
        if(xtop > img.boundaries.max.top) {
            xtop = img.boundaries.max.top;
        }

        // right
        if(xleft < img.boundaries.min.left) {
            xleft = img.boundaries.min.left;
        }

        //bottom
        if(xtop < img.boundaries.min.top) {
            xtop = img.boundaries.min.top;
        }

        $($container).offset({
            top : xtop,
            left : xleft
        }); 

        resize_canvas.getContext('2d').drawImage(orig_src, 0, 0, img.width, img.height);   
        $(image_target).attr('src', resize_canvas.toDataURL("image/png")); // nojquery 
    };

    resizeInitImage = function(width, height, oldWidth, oldHeight){
        console.log(width, height, oldWidth, oldHeight);
        if(oldWidth < oldHeight) {
            ratio = oldWidth/width;
            resize_canvas.width = width;
            resize_canvas.height = oldHeight/ratio;
            img.height = oldHeight/ratio;
            img.width =  width;
        } else {
            ratio = oldHeight/height;
            resize_canvas.width = oldWidth/ratio;
            resize_canvas.height = height;
            img.height = height;
            img.width =  oldWidth/ratio;
        }

        img.boundaries.min = {
            left : Math.round($($overlay).offset().left - (img.width - $($overlay).width())), 
            top : Math.round($($overlay).offset().top - (img.height - $($overlay).height()))
        };

        $($container).offset({
            top : (img.boundaries.min.top + img.boundaries.max.top)/2,
            left : (img.boundaries.min.left + img.boundaries.max.left)/2
        });  
        console.log(orig_src,img.width, img.height);
        image_target.onload = null;
        resize_canvas.getContext('2d').drawImage(orig_src, 0, 0, img.width, img.height);   
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

        offset.left = mouse.x - ( event_state.mouse_x - event_state.container_left );
        offset.top = mouse.y - ( event_state.mouse_y - event_state.container_top );

        //left
        if(offset.left  > img.boundaries.max.left) {
            offset.left = img.boundaries.max.left;
        }

        //top
        if(offset.top > img.boundaries.max.top) {
            offset.top = img.boundaries.max.top;
        }

        // right
        if(offset.left < img.boundaries.min.left) {
            offset.left = img.boundaries.min.left;
        }

        //bottom
        if(offset.top < img.boundaries.min.top) {
            offset.top = img.boundaries.min.top;
        }

        $($container).offset({
            'left': offset.left,
            'top':  offset.top 
        });        
    };

    zoom = function() {
        var z = document.getElementById("zoom").value;
        ratio = z;
        img.width = img.originalWidth + (img.originalWidth * ratio);
        img.height = img.originalHeight + (img.originalHeight * ratio);
        resizeImage(img.ratio,ratio);
        img.ratio = ratio;        
    };

    crop = function(){
        //Find the part of the image that is inside the crop box
        var crop_canvas,
            left = $($overlay).offset().left - $($container).offset().left,// nojquery
            top =  $($overlay).offset().top - $($container).offset().top,// nojquery
            width = $($overlay).width(),// nojquery
            height = $($overlay).height();// nojquery
        	
        crop_canvas = document.createElement('canvas');
        crop_canvas.width = width;
        crop_canvas.height = height;
        console.log(width,height,left,top)

        crop_canvas.getContext('2d').drawImage(image_target, left, top, width, height, 0, 0, width, height);
        window.open(crop_canvas.toDataURL("image/png"));
    }

    handleFileSelect = function(evt) {
        var file=evt.currentTarget.files[0];
        var reader = new FileReader();
        if(file.type != "image/jpeg" && file.type != "image/png") {
            //wrong type
            reader.abort();
            return;
        }

        if(file.size/1000000 > 10) {
            //too big to handle
            reader.abort();
            return;
        }

        reader.onError = function(error) {
            console.error(error)
            reader.abort();
            return;
        };
        reader.onloadstart = function(ev) {
        };
        reader.onloadend = function(ev) {
        };

        reader.onload = function (evt) {
            init(evt.target.result)
        };
        reader.readAsDataURL(file);
    };

    $input.addEventListener('change',handleFileSelect);
    window.crop = crop;
};

// Kick everything off with the target image
resizeableImage({
    target : '#image',
    width : 250,
    height : 200,
});// nojquery