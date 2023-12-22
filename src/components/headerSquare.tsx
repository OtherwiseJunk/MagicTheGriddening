import { text } from "stream/consumers";

export default function HeaderSquare(props: {text: string, imageSource: string, imageAltText:string}){
    let imageBlock;
    let textBlock = <div>{props.text}</div>;
    if(props.imageSource){
        imageBlock = <img 
        className="logo bordered top-left top-right bottom-left bottom-right break-all"
        alt={props.imageAltText}
        src={props.imageSource}
        width={64}
        height={64}
        sizes="(min-width: 66em) 64px,
        (min-width:44em) 32px
        (min-width:22em) 16px
        8px"
      />
        textBlock = <div className="hidden md:block">{props.text}</div> 
    }
       
    return(
        <div className="p-2 m-auto square">
        {imageBlock}
        {textBlock}
      </div>
    )
}